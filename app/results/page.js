"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/session";

function ResultsView() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session");
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session.");
      return;
    }
    getSession(sessionId)
      .then(setSession)
      .catch(() => setError("We couldn't load this report. The session may have expired or the connection may be unavailable."));
  }, [sessionId]);

  if (error) {
    return (
      <div className="stack">
        <div className="error-banner" role="alert">{error}</div>
        <button className="secondary" onClick={() => router.push("/")}>Return to start</button>
      </div>
    );
  }
  if (!session) {
    return <div className="async-state" role="status" aria-live="polite"><span className="loading-dot" aria-hidden="true" />Loading your report…</div>;
  }

  const report = session.finalReport || {};
  const history = Array.isArray(session.history) ? session.history : [];
  const answeredHistory = history.filter(
    (entry) =>
      typeof entry.answer === "string" &&
      entry.answer.trim().length > 0 &&
      Number.isFinite(entry.score)
  );
  const answeredCount = answeredHistory.length;
  const skippedCount = history.length - answeredCount;
  const overallScore = answeredCount
    ? Math.max(0, Math.min(10, Math.round(
      answeredHistory.reduce((sum, entry) => sum + entry.score, 0) / answeredCount
    )))
    : null;
  const reportSections = [
    { title: "Top strengths", items: report.topStrengths },
    { title: "Priority improvements", items: report.priorityImprovements },
    { title: "Recommended next steps", items: report.recommendedNextSteps },
  ];

  return (
    <div className="stack results-page">
      <header className="report-header">
        <p className="eyebrow">Interview assessment</p>
        <h1>Interview report</h1>
        <div className="report-meta">
          <span>{session.role}</span>
          <span>{session.seniority} level</span>
        </div>
      </header>

      <section className="card stack report-summary" aria-labelledby="report-summary-title">
        <div className="report-score-row">
          <div className="report-score-block">
            <p className="eyebrow">Overall score</p>
            {overallScore === null ? (
              <strong className="report-score-value report-score-empty">Not enough data</strong>
            ) : (
              <>
                <div className="report-score-value" aria-label={`Overall score ${overallScore} out of 10`}>
                  {overallScore}<span> / 10</span>
                </div>
                <div
                  className="score-meter"
                  role="meter"
                  aria-label="Overall score out of 10"
                  aria-valuemin={0}
                  aria-valuemax={10}
                  aria-valuenow={overallScore}
                >
                  <div className="score-meter-fill" style={{ width: `${overallScore * 10}%` }} />
                </div>
              </>
            )}
          </div>
          <div>
            <h2 className="report-section-title" id="report-summary-title">Overall feedback</h2>
            <p className="report-summary-text">
              {overallScore === null
                ? "No answers were submitted, so there is not enough information to assess this interview."
                : report.summary || "Your evaluated answers are reflected in the score and question-level feedback below."}
            </p>
          </div>
        </div>

        <div className="report-counts">
          <span className="report-count"><strong>{answeredCount} of {history.length}</strong> questions answered</span>
          {skippedCount > 0 && <span className="report-count"><strong>{skippedCount}</strong> skipped</span>}
        </div>
      </section>

      <div className="report-highlights">
        {reportSections.map(({ title, items }) => (
          <section className="report-highlight" key={title}>
            <h2>{title}</h2>
            {Array.isArray(items) && items.some((item) => typeof item === "string") ? (
              <ul className="feedback-list">
                {items.filter((item) => typeof item === "string").map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
              </ul>
            ) : (
              <p className="report-empty">{overallScore === null ? "Available after an answer is submitted." : "No items available."}</p>
            )}
          </section>
        ))}
      </div>

      <section className="stack question-results" aria-labelledby="question-breakdown-title">
        <h2 id="question-breakdown-title">Question-by-question breakdown</h2>
        {history.map((item, index) => {
          const wasEvaluated =
            typeof item.answer === "string" &&
            item.answer.trim().length > 0 &&
            Number.isFinite(item.score);

          return (
            <article className="card question-result" key={`${index}-${item.question}`}>
              <div className="question-result-header">
                <div>
                  <p className="eyebrow">Question {index + 1}</p>
                  <h3>{item.question || "Question unavailable"}</h3>
                </div>
                <div className="question-result-status">
                  {wasEvaluated ? (
                    <span className="badge">Answered</span>
                  ) : (
                    <span className="badge status-skipped">Skipped</span>
                  )}
                  {wasEvaluated && <span className="score-pill result-score">{item.score}/10</span>}
                </div>
              </div>

              {wasEvaluated ? (
                <>
                  <p className="question-result-copy"><strong>Your answer</strong><br />{item.answer}</p>
                  {item.feedback && <p className="question-result-feedback">{item.feedback}</p>}
                  <div className="result-lists">
                    {Array.isArray(item.strengths) && item.strengths.some((point) => typeof point === "string") && (
                      <div>
                        <strong>What worked</strong>
                        <ul className="feedback-list">{item.strengths.filter((point) => typeof point === "string").map((point, i) => <li key={i}>{point}</li>)}</ul>
                      </div>
                    )}
                    {Array.isArray(item.improvements) && item.improvements.some((point) => typeof point === "string") && (
                      <div>
                        <strong>To improve</strong>
                        <ul className="feedback-list">{item.improvements.filter((point) => typeof point === "string").map((point, i) => <li key={i}>{point}</li>)}</ul>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="question-result-copy">No answer was submitted. This question was excluded from the overall score.</p>
              )}
            </article>
          );
        })}
      </section>

      <button className="secondary" onClick={() => router.push("/")}>
        Start another interview
      </button>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="card">Loading…</div>}>
      <ResultsView />
    </Suspense>
  );
}
