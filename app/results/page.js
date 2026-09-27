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
      .catch(() => setError("Couldn't load this session's results."));
  }, [sessionId]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!session) return <div className="card">Loading your report…</div>;

  const report = session.finalReport;

  return (
    <div className="stack">
      <div>
        <h1>Interview report</h1>
        <p className="subtitle">
          {session.role} &middot; {session.seniority} level &middot; {session.history.length} questions
        </p>
      </div>

      {report ? (
        <div className="card stack">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="score-pill" style={{ width: 56, height: 56, fontSize: "1.3rem" }}>
              {report.overallScore}
            </span>
            <div>
              <strong>Overall score (out of 10)</strong>
              <p className="subtitle" style={{ margin: 0 }}>{report.summary}</p>
            </div>
          </div>

          <div>
            <strong>Top strengths</strong>
            <ul className="feedback-list">
              {report.topStrengths?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div>
            <strong>Priority improvements</strong>
            <ul className="feedback-list">
              {report.priorityImprovements?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div>
            <strong>Recommended next steps</strong>
            <ul className="feedback-list">
              {report.recommendedNextSteps?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
      ) : (
        <div className="card">Report not available for this session.</div>
      )}

      <div className="card stack">
        <h2>Question-by-question breakdown</h2>
        {session.history.map((h, i) => (
          <div className="history-item" key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <strong>Q{i + 1}. {h.question}</strong>
              <span className="score-pill" style={{ width: 32, height: 32, fontSize: "0.85rem" }}>
                {h.score ?? "–"}
              </span>
            </div>
            <p className="subtitle" style={{ margin: "6px 0 0" }}>{h.feedback}</p>
          </div>
        ))}
      </div>

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
