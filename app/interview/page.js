"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getSession,
  appendHistoryEntry,
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
  const total = Number(params.get("total") || 5);

  const [session, setSession] = useState(null);
  const [current, setCurrent] = useState(null); // { question, type, difficulty }
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null); // { score, feedback, strengths, improvements }
  const [phase, setPhase] = useState("loading"); // loading | asking | evaluating | feedback | finishing
  const [error, setError] = useState(null);

  const loadNextQuestion = useCallback(async (history, role, seniority) => {
    setPhase("loading");
    try {
      const res = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, seniority, history }),
      });
      if (!res.ok) throw new Error("generate-question failed");
      const q = await res.json();
      await appendHistoryEntry(sessionId, {
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        answer: null,
        score: null,
      });
      setCurrent(q);
      setAnswer("");
      setEvaluation(null);
      setPhase("asking");
    } catch (err) {
      console.error(err);
      setError("Couldn't generate the next question. Please try again.");
      setPhase("asking");
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session. Please start a new interview from the home page.");
      return;
    }
    (async () => {
      try {
        const s = await getSession(sessionId);
        setSession(s);
        if (s.history.length === 0) {
          await loadNextQuestion([], s.role, s.seniority);
        } else {
          const last = s.history[s.history.length - 1];
          if (last.answer === null) {
            setCurrent(last);
            setPhase("asking");
          } else {
            await loadNextQuestion(s.history, s.role, s.seniority);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Couldn't load this session.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function handleSubmitAnswer() {
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
      if (!res.ok) throw new Error("evaluate-answer failed");
      const evalResult = await res.json();
      await updateLastAnswer(sessionId, { answer, ...evalResult });
      setEvaluation(evalResult);
      setPhase("feedback");
    } catch (err) {
      console.error(err);
      setError("Couldn't evaluate that answer. Please try submitting again.");
      setPhase("asking");
    }
  }

  async function handleNext() {
    const s = await getSession(sessionId);
    setSession(s);
    const answered = s.history.filter((h) => h.answer !== null).length;

    if (answered >= total) {
      setPhase("finishing");
      try {
        const res = await fetch("/api/session/final-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: s.role,
            seniority: s.seniority,
            history: s.history,
          }),
        });
        const report = await res.json();
        await completeSession(sessionId, report);
        router.push(`/results?session=${sessionId}`);
      } catch (err) {
        console.error(err);
        setError("Couldn't generate your final report. Your answers are saved — try again.");
        setPhase("feedback");
      }
      return;
    }

    await loadNextQuestion(s.history, s.role, s.seniority);
  }

  if (error && !session) {
    return <div className="error-banner">{error}</div>;
  }

  if (!session || phase === "loading") {
    return <div className="card">Preparing your next question…</div>;
  }

  const answeredCount = session.history.filter((h) => h.answer !== null).length;

  return (
    <div className="stack">
      <ProgressBar current={answeredCount} total={total} />

      <div className="card stack">
        {current && (
          <QuestionCard
            question={current.question}
            type={current.type}
            difficulty={current.difficulty}
          />
        )}

        {error && <div className="error-banner">{error}</div>}

        {phase === "asking" && (
          <AnswerInput
            value={answer}
            onChange={setAnswer}
            onSubmit={handleSubmitAnswer}
            disabled={false}
            loading={false}
          />
        )}

        {phase === "evaluating" && (
          <AnswerInput value={answer} onChange={setAnswer} onSubmit={() => {}} disabled loading />
        )}

        {phase === "feedback" && evaluation && (
          <FeedbackPanel
            score={evaluation.score}
            feedback={evaluation.feedback}
            strengths={evaluation.strengths}
            improvements={evaluation.improvements}
            onNext={handleNext}
            isLast={answeredCount >= total}
          />
        )}

        {phase === "finishing" && <p>Putting together your final report…</p>}
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
