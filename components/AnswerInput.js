export default function AnswerInput({ value, onChange, onSubmit, onSkip, disabled, loading }) {
  return (
    <form
      className="stack answer-input"
      aria-busy={loading}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <label htmlFor="answer">Your answer</label>
        <textarea
          id="answer"
          placeholder="Structure your thoughts and include examples where relevant…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          aria-describedby="answer-help"
        />
      </div>
      <p className="answer-help" id="answer-help">Your answer will be evaluated before the next question.</p>
      <div className="answer-actions">
        <button type="submit" className="primary" disabled={disabled || loading || !value.trim()}>
          {loading ? "Evaluating…" : "Submit answer"}
        </button>
        {onSkip && (
          <button type="button" className="secondary" onClick={onSkip} disabled={disabled || loading}>
            Skip question
          </button>
        )}
      </div>
    </form>
  );
}
