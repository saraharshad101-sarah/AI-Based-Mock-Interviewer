export default function QuestionCard({ question, type, difficulty }) {
  return (
    <section className="stack question-card" aria-labelledby="current-question">
      <div className="question-tags">
        {type && <span className="badge">{type.replace("_", " ")}</span>}
        {difficulty && (
          <span className={`badge difficulty-${difficulty}`}>{difficulty}</span>
        )}
      </div>
      <h2 id="current-question">{question}</h2>
    </section>
  );
}
