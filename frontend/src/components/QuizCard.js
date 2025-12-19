import { useReactions } from "../context/ReactionsContext";

function QuizCard({ quiz, onClick }) {
  const { reactions } = useReactions();
  const reactionInfo = reactions[quiz.id];

  const likes = reactionInfo?.likes ?? quiz.likes ?? 0;
  const dislikes = reactionInfo?.dislikes ?? quiz.dislikes ?? 0;
  const score = likes - dislikes;
  const scoreIcon = score < 0 ? '👎' : '👍';

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
        </div>
        <div className="quiz-card__meta">
          <span className="quiz-card__author">by {quiz.author}</span>
          <span className="quiz-card__score">
          {quiz.lastScore !== undefined && quiz.lastScore !== null
              ? `Last score: ${quiz.lastScore}%`
              : 'Not taken yet'}
        </span>
        </div>
        <div className="quiz-card__footer">
          <div className="quiz-card__footer-left">
            <div className={`quiz-card__reaction reaction-score-neutral`}>
              <span className="quiz-card__reaction-number">{score}</span>
              <span className="quiz-card__reaction-icon">{scoreIcon}</span>
            </div>
          </div>

          <div className="quiz-card__footer-right">
            <span className="quiz-card__tag">{quiz.tags[0] || 'general'}</span>
            <span className="quiz-card__icon">{quiz.icon || '📝'}</span>
          </div>
        </div>
      </article>
  );
}

export default QuizCard;
