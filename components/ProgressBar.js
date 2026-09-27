export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="subtitle" style={{ margin: "-8px 0 16px", fontSize: "0.82rem" }}>
        Question {Math.min(current + 1, total)} of {total}
      </p>
    </div>
  );
}
