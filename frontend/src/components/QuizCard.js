function QuizCard({ quiz, onClick }) {
  const handleActivate = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <article
      className="card quiz-card"
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      onKeyUp={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleActivate();
        }
      }}
    >
      <div className="quiz-card__header">
        <h3 className="quiz-card__title">{quiz.name}</h3>
        <span className="quiz-card__tag">{quiz.tags[0] || 'general'}</span>
      </div>
      <div className="quiz-card__meta">
        <span className="quiz-card__author">by {quiz.author}</span>
        <span className="quiz-card__score">
          {quiz.lastScore !== undefined && quiz.lastScore !== null
            ? `Last score: ${quiz.lastScore}%`
            : 'Not taken yet'}
        </span>
      </div>
    </article>
  );
}

export default QuizCard;
