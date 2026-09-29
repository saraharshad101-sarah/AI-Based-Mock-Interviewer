export default function ProgressBar({ current, total }) {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.min(Math.max(current, 1), safeTotal);
  const pct = Math.round((safeCurrent / safeTotal) * 100);
  return (
    <div aria-label="Interview progress">
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Questions reached"
        aria-valuemin={1}
        aria-valuemax={safeTotal}
        aria-valuenow={safeCurrent}
      >
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="progress-label">
        <span>Interview progress</span>
        <span>Question {safeCurrent} of {safeTotal}</span>
      </p>
    </div>
  );
}
