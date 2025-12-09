import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuizDetail } from '../hooks/useQuizDetail';

function Review() {
  const { quizId } = useParams();
  const { quiz, loading, error } = useQuizDetail(quizId);
  const [searchParams] = useSearchParams();

  const wrongAnswers = useMemo(() => {
    const raw = searchParams.get('wrong') || '';
    return raw.split(',').filter(Boolean);
  }, [searchParams]);

  const userAnswers = useMemo(() => {
    const raw = searchParams.get('answers') || '';
    if (!raw) return {};
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return {};
    }
  }, [searchParams]);

  const incorrectAttempts = useMemo(() => {
    const raw = searchParams.get('incorrect') || '';
    if (!raw) return {};
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return {};
    }
  }, [searchParams]);

  if (loading) {
    return <div className="muted">Loading review...</div>;
  }

  if (error || !quiz) {
    return <div className="empty">Quiz not found.</div>;
  }

  // Helper function to decode gap option text
  const decodeGapOptionText = (text) => {
    if (typeof text !== 'string') return text;
    const match = text.match(/^__G\d+__(.*)$/);
    return match ? match[1] : text;
  };

  // Check if question is fill-in-the-gap type
  const isFillGapQuestion = (question) => {
    if (!question.text || typeof question.text !== 'string') return false;
    if (!Array.isArray(question.options) || question.options.length === 0) return false;
    const hasGap = /_{1,}/.test(question.text);
    const hasEncodedOptions = question.options.some((opt) => typeof opt.text === 'string' && /^__G\d+__/.test(opt.text));
    return hasGap && hasEncodedOptions;
  };

  return (
    <div>
      <h2 className="section-title">Quiz Review</h2>
      <div className="card stack" style={{ marginBottom: '16px' }}>
        <h3>{quiz.name}</h3>
        <div className="muted">Review your answers and explanations</div>
      </div>

      {quiz.questions.map((question, qIndex) => {
        const isWrong = wrongAnswers.includes(question.id);
        const isFillGap = isFillGapQuestion(question);
        const userAnswer = userAnswers[question.id];
        const questionIncorrectAttempts = incorrectAttempts[question.id] || [];
        const hasIncorrectAttempts = questionIncorrectAttempts.length > 0;

        return (
          <div key={question.id} className="card stack" style={{ marginBottom: '16px' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ margin: 0 }}>Question {qIndex + 1}</h3>
              <span className={`pill ${isWrong ? 'pill-wrong' : 'pill-correct'}`}>
                {isWrong ? '✗ Incorrect' : '✓ Correct'}
              </span>
            </div>

            {/* Question text and image */}
            <div>
              {isFillGap ? (
                <div style={{ marginBottom: '12px' }}>
                  {question.text.split(/_{1,}/).map((part, i, arr) => {
                    if (i === arr.length - 1) return <span key={i}>{part}</span>;
                    return (
                      <span key={i}>
                        {part}
                        <span className="gap-placeholder">___</span>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div style={{ marginBottom: '12px' }}>{question.text}</div>
              )}
              {question.image_url && (
                <img
                  src={question.image_url}
                  alt="Question"
                  style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', marginBottom: '12px' }}
                />
              )}
            </div>

            {/* Options */}
            <div style={{ marginBottom: '12px' }}>
              {!isFillGap ? (
                // Basic question options
                question.options.map((option, optIndex) => {
                  const isCorrect = option.is_correct;
                  
                  // Check if this option was selected incorrectly
                  let wasIncorrectlySelected = false;
                  if (hasIncorrectAttempts) {
                    wasIncorrectlySelected = questionIncorrectAttempts.some(attempt => {
                      if (Array.isArray(attempt)) {
                        return attempt.includes(option.index);
                      }
                      return attempt === option.index;
                    });
                  }
                  
                  // Only show as "selected" if it was an incorrect attempt
                  const wasSelected = hasIncorrectAttempts ? wasIncorrectlySelected : (
                    Array.isArray(userAnswer)
                      ? userAnswer.includes(option.index)
                      : userAnswer === option.index
                  );

                  let bgColor = 'rgba(13, 23, 48, 0.4)';
                  let borderColor = 'rgba(118, 139, 180, 0.35)';
                  
                  // If there were incorrect attempts, only show correct answer styling, not the final correct one
                  if (hasIncorrectAttempts) {
                    if (wasIncorrectlySelected) {
                      bgColor = 'rgba(251, 143, 143, 0.15)';
                      borderColor = 'rgba(251, 143, 143, 0.5)';
                    }
                  } else {
                    // No incorrect attempts, show normal coloring
                    if (isCorrect) {
                      bgColor = 'rgba(74, 214, 165, 0.15)';
                      borderColor = 'rgba(74, 214, 165, 0.5)';
                    } else if (wasSelected) {
                      bgColor = 'rgba(251, 143, 143, 0.15)';
                      borderColor = 'rgba(251, 143, 143, 0.5)';
                    }
                  }

                  return (
                    <div 
                      key={optIndex} 
                      style={{ 
                        padding: '10px 12px', 
                        marginBottom: '6px', 
                        borderRadius: '10px', 
                        border: `1px solid ${borderColor}`,
                        background: bgColor,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div className="row" style={{ gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                          {!hasIncorrectAttempts && isCorrect && <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '16px' }}>✓</span>}
                          {wasSelected && hasIncorrectAttempts && <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '16px' }}>✗</span>}
                          <span style={{ color: 'var(--text)' }}>{option.text}</span>
                        </div>
                        <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                          {wasSelected && hasIncorrectAttempts && (
                            <span style={{ 
                              fontSize: '12px', 
                              color: 'var(--danger)',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'rgba(251, 143, 143, 0.2)'
                            }}>
                              Your answer
                            </span>
                          )}
                          {option.image_url && (
                            <img
                              src={option.image_url}
                              alt={`Option ${optIndex + 1}`}
                              style={{ maxHeight: '60px', borderRadius: '6px' }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Fill-in-the-gap question
                (() => {
                  const gapMap = new Map();
                  question.options.forEach((opt) => {
                    if (typeof opt.text !== 'string') return;
                    const match = opt.text.match(/^__G(\d+)__(.*)$/);
                    if (!match) return;
                    const gIdx = parseInt(match[1], 10);
                    if (!gapMap.has(gIdx)) {
                      gapMap.set(gIdx, []);
                    }
                    gapMap.get(gIdx).push({ ...opt, decodedText: match[2] });
                  });

                  const gapIndices = Array.from(gapMap.keys()).sort((a, b) => a - b);

                  return gapIndices.map((gIdx) => {
                    const options = gapMap.get(gIdx);
                    const userGapAnswer = userAnswer?.[gIdx];

                    return (
                      <div key={gIdx} style={{ marginBottom: '12px' }}>
                        <div className="muted" style={{ fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                          Gap {gIdx + 1}:
                        </div>
                        {options.map((opt, oIdx) => {
                          const isCorrect = opt.is_correct;
                          
                          // Check if this option was selected incorrectly in any attempt
                          let wasIncorrectlySelected = false;
                          if (hasIncorrectAttempts) {
                            wasIncorrectlySelected = questionIncorrectAttempts.some(attempt => {
                              return attempt[gIdx] === opt.index;
                            });
                          }
                          
                          const wasSelected = hasIncorrectAttempts ? wasIncorrectlySelected : (userGapAnswer === opt.index);

                          let bgColor = 'rgba(13, 23, 48, 0.4)';
                          let borderColor = 'rgba(118, 139, 180, 0.35)';
                          
                          if (hasIncorrectAttempts) {
                            if (wasIncorrectlySelected) {
                              bgColor = 'rgba(251, 143, 143, 0.15)';
                              borderColor = 'rgba(251, 143, 143, 0.5)';
                            }
                          } else {
                            if (isCorrect) {
                              bgColor = 'rgba(74, 214, 165, 0.15)';
                              borderColor = 'rgba(74, 214, 165, 0.5)';
                            } else if (wasSelected) {
                              bgColor = 'rgba(251, 143, 143, 0.15)';
                              borderColor = 'rgba(251, 143, 143, 0.5)';
                            }
                          }

                          return (
                            <div 
                              key={oIdx} 
                              style={{ 
                                padding: '10px 12px', 
                                marginBottom: '6px', 
                                borderRadius: '10px', 
                                border: `1px solid ${borderColor}`,
                                background: bgColor,
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div className="row" style={{ gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                                  {!hasIncorrectAttempts && isCorrect && <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '16px' }}>✓</span>}
                                  {wasSelected && hasIncorrectAttempts && <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '16px' }}>✗</span>}
                                  <span style={{ color: 'var(--text)' }}>{opt.decodedText}</span>
                                </div>
                                {wasSelected && hasIncorrectAttempts && (
                                  <span style={{ 
                                    fontSize: '12px', 
                                    color: 'var(--danger)',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(251, 143, 143, 0.2)'
                                  }}>
                                    Your answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                })()
              )}
            </div>

            {/* Explanation */}
            {question.explanation && (
              <div style={{ 
                padding: '12px 16px', 
                background: 'rgba(110, 168, 255, 0.12)', 
                borderRadius: '10px', 
                borderLeft: '3px solid var(--primary)',
                marginTop: '4px'
              }}>
                <div style={{ 
                  fontWeight: 600, 
                  marginBottom: '6px', 
                  color: 'var(--primary)',
                  fontSize: '14px'
                }}>
                  Explanation:
                </div>
                <div style={{ 
                  color: 'var(--text)',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {question.explanation}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="card stack">
        <div className="row" style={{ gap: '8px' }}>
          <Link className="btn" to={`/results/${quizId}?score=${searchParams.get('score') || '0'}&wrong=${wrongAnswers.join(',')}&answers=${searchParams.get('answers') || '{}'}&incorrect=${searchParams.get('incorrect') || '{}'}`}>
            ← Back to Results
          </Link>
          <Link className="btn" to="/">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Review;
