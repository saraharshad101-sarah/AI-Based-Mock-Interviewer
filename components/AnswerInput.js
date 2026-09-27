export default function AnswerInput({ value, onChange, onSubmit, disabled, loading }) {
  return (
    <form
      className="stack"
      style={{ gap: 12 }}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <label htmlFor="answer">Your answer</label>
        <textarea
          id="answer"
          placeholder="Type your answer as you would say it out loud…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      <button type="submit" className="primary" disabled={disabled || !value.trim()}>
        {loading ? "Evaluating…" : "Submit answer"}
      </button>
    </form>
  );
}
