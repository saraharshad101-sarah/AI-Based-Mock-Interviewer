"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getSession,
  appendHistoryEntry,
  skipLastQuestion,
  updateLastAnswer,
  completeSession,
} from "@/lib/session";
import QuestionCard from "@/components/QuestionCard";
import AnswerInput from "@/components/AnswerInput";
import FeedbackPanel from "@/components/FeedbackPanel";
import ProgressBar from "@/components/ProgressBar";

function InterviewFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session");
  const requestedTotal = Number(params.get("total") || 5);
  const total = [3, 5, 7].includes(requestedTotal) ? requestedTotal : 5;

  const [session, setSession] = useState(null);
  const [current, setCurrent] = useState(null); // { question, type, difficulty }
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null); // { score, feedback, strengths, improvements }
  const [phase, setPhase] = useState("loading"); // loading | asking | evaluating | feedback | finishing
  const [error, setError] = useState(null);
  const operationInFlight = useRef(false);
  const initializedSession = useRef(null);

  const loadNextQuestion = useCallback(async (history, role, seniority) => {
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, seniority, history }),
      });
      if (!res.ok) throw new Error("Question request failed");
      const q = await res.json();
      if (typeof q.question !== "string" || !q.question.trim()) {
        throw new Error("Question response was invalid");
      }
      const updatedHistory = await appendHistoryEntry(sessionId, {
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        answer: null,
        score: null,
      });
      setSession((previous) => previous ? { ...previous, history: updatedHistory } : previous);
      setCurrent(q);
      setAnswer("");
      setEvaluation(null);
      setPhase("asking");
    } catch {
      setError("We couldn't generate the next question. Check your connection and try again.");
      setPhase("question-error");
    }
  }, [sessionId]);

  const generateFinalReport = useCallback(async (s) => {
    setPhase("finishing");
    setError(null);
    try {
      const res = await fetch("/api/session/final-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: s.role, seniority: s.seniority, history: s.history }),
      });
      if (!res.ok) throw new Error("Report request failed");
      const report = await res.json();
      await completeSession(sessionId, report);
      router.push(`/results?session=${sessionId}`);
    } catch {
      setError("We couldn't generate the final report. Your answers are saved; try again.");
      setPhase("report-error");
    }
  }, [router, sessionId]);

  const continueInterview = useCallback(async (s) => {
    setSession(s);
    if (s.history.length >= total) {
      await generateFinalReport(s);
      return;
    }
    await loadNextQuestion(s.history, s.role, s.seniority);
  }, [generateFinalReport, loadNextQuestion, total]);

  const initializeSession = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const loaded = await getSession(sessionId);
      const s = { ...loaded, history: Array.isArray(loaded.history) ? loaded.history : [] };
      setSession(s);
      if (s.status === "completed" && s.finalReport) {
        router.replace(`/results?session=${sessionId}`);
        return;
      }
      if (s.history.length >= total) {
        await generateFinalReport(s);
        return;
      }
      if (s.history.length === 0) {
        await loadNextQuestion([], s.role, s.seniority);
        return;
      }

      const last = s.history[s.history.length - 1];
      if (last.answer == null) {
        setCurrent(last);
        setAnswer("");
        setPhase("asking");
      } else {
        await loadNextQuestion(s.history, s.role, s.seniority);
      }
    } catch {
      initializedSession.current = null;
      setError("We couldn't load this interview. It may have expired, or the connection may be unavailable.");
      setPhase("session-error");
    }
  }, [generateFinalReport, loadNextQuestion, router, sessionId, total]);

  useEffect(() => {
    if (!sessionId) {
      setError("This interview link is missing its session. Start a new interview from the home page.");
      setPhase("session-error");
      return;
    }
    if (initializedSession.current === sessionId) return;
    initializedSession.current = sessionId;
    initializeSession();
  }, [initializeSession, sessionId]);

  async function handleSubmitAnswer() {
    if (operationInFlight.current || phase !== "asking" || !answer.trim() || !current || !session) return;
    operationInFlight.current = true;
    setPhase("evaluating");
    setError(null);
    try {
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: session.role,
          seniority: session.seniority,
          question: current.question,
          answer,
        }),
      });
      if (!res.ok) throw new Error("Answer evaluation failed");
      const evalResult = await res.json();
      if (!Number.isInteger(evalResult.score) || evalResult.score < 0 || evalResult.score > 10) {
        throw new Error("Evaluation response was invalid");
      }
      const updatedHistory = await updateLastAnswer(sessionId, { answer, ...evalResult });
      setSession((previous) => previous ? { ...previous, history: updatedHistory } : previous);
      setEvaluation(evalResult);
      setPhase("feedback");
    } catch {
      setError("We couldn't evaluate your answer. Your response is still here; check your connection and try again.");
      setPhase("asking");
    } finally {
      operationInFlight.current = false;
    }
  }

  async function handleNext() {
    if (operationInFlight.current || phase !== "feedback") return;
    operationInFlight.current = true;
    setPhase("loading");
    setError(null);
    try {
      const loaded = await getSession(sessionId);
      const s = { ...loaded, history: Array.isArray(loaded.history) ? loaded.history : [] };
      await continueInterview(s);
    } catch {
      setError("We couldn't load your saved progress. Check your connection and try again.");
      setPhase("feedback");
    } finally {
      operationInFlight.current = false;
    }
  }

  async function handleSkip() {
    if (operationInFlight.current || phase !== "asking" || !session) return;
    operationInFlight.current = true;
    setPhase("loading");
    setError(null);
    try {
      const updatedHistory = await skipLastQuestion(sessionId);
      const s = { ...session, history: updatedHistory };
      setSession(s);
      await continueInterview(s);
    } catch {
      setError("We couldn't save that skip. Your current question is still available; try again.");
      setPhase("asking");
    } finally {
      operationInFlight.current = false;
    }
  }

  async function retryQuestion() {
    if (operationInFlight.current || !session) return;
    operationInFlight.current = true;
    setPhase("loading");
    setError(null);
    try {
      const loaded = await getSession(sessionId);
      const history = Array.isArray(loaded.history) ? loaded.history : [];
      const s = { ...loaded, history };
      setSession(s);
      if (history.length >= total) {
        await generateFinalReport(s);
      } else {
        await loadNextQuestion(history, s.role, s.seniority);
      }
    } catch {
      setError("We couldn't restore your saved progress. Try reloading the interview.");
      setPhase("session-error");
    } finally {
      operationInFlight.current = false;
    }
  }

  async function retryReport() {
    if (operationInFlight.current) return;
    operationInFlight.current = true;
    setPhase("finishing");
    setError(null);
    try {
      const loaded = await getSession(sessionId);
      const s = { ...loaded, history: Array.isArray(loaded.history) ? loaded.history : [] };
      await generateFinalReport(s);
    } catch {
      setError("We couldn't load your saved answers. Check your connection and try again.");
      setPhase("report-error");
    } finally {
      operationInFlight.current = false;
    }
  }

  async function retrySession() {
    if (operationInFlight.current) return;
    operationInFlight.current = true;
    initializedSession.current = sessionId;
    try {
      await initializeSession();
    } finally {
      operationInFlight.current = false;
    }
  }

  if (phase === "session-error") {
    return (
      <div className="stack">
        <div className="error-banner" role="alert">{error}</div>
        {sessionId ? (
          <button className="secondary" onClick={retrySession}>Retry loading interview</button>
        ) : (
          <button className="secondary" onClick={() => router.push("/")}>Return to start</button>
        )}
      </div>
    );
  }

  if (!session || phase === "loading" || phase === "finishing") {
    const message = phase === "finishing"
      ? "Generating your final report…"
      : session
        ? "Generating your next question…"
        : "Loading your interview session…";
    return (
      <div className="async-state" role="status" aria-live="polite">
        <span className="loading-dot" aria-hidden="true" />{message}
      </div>
    );
  }

  const currentQuestion = session.history.length;

  return (
    <div className="stack interview-page">
      <div className="interview-meta">
        <p><strong>Target role</strong> &middot; {session.role}</p>
        <p><strong>Level</strong> &middot; {session.seniority}</p>
      </div>

      <ProgressBar current={currentQuestion} total={total} />

      <div className="card stack">
        {current && ["asking", "evaluating", "feedback"].includes(phase) && (
          <QuestionCard
            question={current.question}
            type={current.type}
            difficulty={current.difficulty}
          />
        )}

        {error && <div className="error-banner" role="alert">{error}</div>}

        {phase === "question-error" && (
          <button className="secondary" onClick={retryQuestion}>Retry question</button>
        )}

        {phase === "asking" && (
          <AnswerInput
            value={answer}
            onChange={setAnswer}
            onSubmit={handleSubmitAnswer}
            onSkip={handleSkip}
            disabled={false}
            loading={false}
          />
        )}

        {phase === "evaluating" && (
          <div className="stack">
            <AnswerInput value={answer} onChange={setAnswer} onSubmit={() => {}} disabled loading />
            <p className="async-state" role="status" aria-live="polite">
              <span className="loading-dot" aria-hidden="true" />Evaluating your answer…
            </p>
          </div>
        )}

        {phase === "feedback" && evaluation && (
          <FeedbackPanel
            score={evaluation.score}
            feedback={evaluation.feedback}
            strengths={evaluation.strengths}
            improvements={evaluation.improvements}
            onNext={handleNext}
            isLast={session.history.length >= total}
          />
        )}

        {phase === "report-error" && (
          <button className="secondary" onClick={retryReport}>Retry final report</button>
        )}
      </div>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="card">Loading…</div>}>
      <InterviewFlow />
    </Suspense>
  );
}
