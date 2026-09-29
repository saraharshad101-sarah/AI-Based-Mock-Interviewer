export default function FeedbackPanel({ score, feedback, strengths, improvements, onNext, isLast }) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="score-pill feedback-score" aria-label={`Answer score ${score} out of 10`}>
          {score}/10
        </span>
        <div>
          <strong>Answer evaluation</strong>
          <p className="subtitle" style={{ margin: 0 }}>{feedback}</p>
        </div>
      </div>

      {strengths?.length > 0 && (
        <div>
          <strong>What worked</strong>
          <ul className="feedback-list">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {improvements?.length > 0 && (
        <div>
          <strong>To improve</strong>
          <ul className="feedback-list">
            {improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" className="primary" onClick={onNext}>
        {isLast ? "Finish interview & see report" : "Next question"}
      </button>
    </div>
  );
}
