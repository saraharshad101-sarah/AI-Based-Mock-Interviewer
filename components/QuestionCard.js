export default function QuestionCard({ question, type, difficulty }) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {type && <span className="badge">{type.replace("_", " ")}</span>}
        {difficulty && (
          <span className={`badge difficulty-${difficulty}`}>{difficulty}</span>
        )}
      </div>
      <h2 style={{ lineHeight: 1.4 }}>{question}</h2>
    </div>
  );
}
