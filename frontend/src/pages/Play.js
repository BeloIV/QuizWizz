import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useQuizDetail } from '../hooks/useQuizDetail';

function Play() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { quiz, loading, error } = useQuizDetail(quizId);
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]); // For multi-answer questions
  const [disabledOptions, setDisabledOptions] = useState({});
  const [reveal, setReveal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [fillGapIncorrectIndices, setFillGapIncorrectIndices] = useState([]);
  const initiallyWrongRef = useRef(new Set());
  const timeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    setIndex(0);
    setSelectedIndex(null);
    setSelectedIndices([]);
    setDisabledOptions({});
    setReveal(false);
    setProcessing(false);
    setFillGapIncorrectIndices([]);
    initiallyWrongRef.current = new Set();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
  }, [quizId, quiz?.id]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const currentQuestion = useMemo(() => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return null;
    }
    return quiz.questions[index] || null;
  }, [quiz, index]);

  // Check if the current question is a fill-in-the-gap question
  const isFillInTheGap = useMemo(() => {
    return currentQuestion?.question_type === 'FILL_IN_THE_GAP';
  }, [currentQuestion]);

  // Determine if current question has multiple correct answers
  const isMultiAnswer = useMemo(() => {
    if (!currentQuestion?.options) return false;
    const correctCount = currentQuestion.options.filter(opt => opt.is_correct).length;
    return correctCount > 1;
  }, [currentQuestion]);

  const { choices: fillGapChoices, indices: fillGapChoiceIndices } = useMemo(() => {
    if (!isFillInTheGap || !currentQuestion?.options || currentQuestion.options.length === 0) {
      return { choices: [], indices: [] };
    }

    // Base texts and original indices from options
    const base = currentQuestion.options.map(opt => (opt.text || '').trim());
    const originalIndices = currentQuestion.options.map(opt => opt.index);

    // Build an array of positions and shuffle it
    const order = base.map((_, idx) => idx);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    return {
      choices: order.map(i => base[i]),
      indices: order.map(i => originalIndices[i]),
    };
  }, [isFillInTheGap, currentQuestion]);

  const fillGapCorrectAnswers = useMemo(() => {
    if (!isFillInTheGap || !currentQuestion?.options || currentQuestion.options.length === 0) {
      return [];
    }
    const rawCorrect = currentQuestion.options[0]?.text || '';
    return rawCorrect
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [isFillInTheGap, currentQuestion]);

  const correctIndex = currentQuestion?.correct_index;
  const correctIndices = useMemo(() => {
    if (!currentQuestion?.options) return [];
    return currentQuestion.options
      .filter(opt => opt.is_correct)
      .map(opt => opt.index);
  }, [currentQuestion]);
  const totalQuestions = quiz?.questions?.length || 0;

  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions.length === 0 && !loading && !error) {
      navigate(`/results/${quiz.id}?score=0&wrong=`);
    }
  }, [quiz, loading, error, navigate]);

  const handleSubmit = (overrideIndex, fillAnswer) => {
    if (!quiz || !currentQuestion || processing || reveal) {
      return;
    }

    let isCorrect = false;

    if (isFillInTheGap) {
      // Treat fill-in-the-gap like a pure single-answer question using correctIndex, with shuffled choices
      const chosenIndex = typeof overrideIndex === 'number' ? overrideIndex : selectedIndex;
      if (chosenIndex === null || chosenIndex === undefined) {
        return;
      }

      const originalIndex = fillGapChoiceIndices[chosenIndex];
      isCorrect = originalIndex === correctIndex;
    } else if (isMultiAnswer) {
      // Multi-answer question: use checkbox mode for this question
      // Check if selectedIndices match correctIndices
      const selectedSet = new Set(selectedIndices);
      const correctSet = new Set(correctIndices);
      isCorrect = selectedSet.size === correctSet.size && 
        [...selectedSet].every(idx => correctSet.has(idx));
    } else {
      // Pure single-answer quiz - use old behavior
      const chosenIndex = typeof overrideIndex === 'number' ? overrideIndex : selectedIndex;
      if (chosenIndex === null || chosenIndex === undefined) {
        return;
      }
      isCorrect = chosenIndex === correctIndex;
    }

    if (isCorrect) {
      setReveal(true);
      setProcessing(true);
      setFillGapIncorrectIndices([]);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        const nextIndex = index + 1;
        if (nextIndex >= totalQuestions) {
          const wrongIds = Array.from(initiallyWrongRef.current);
          const wrongCount = wrongIds.length;
          const score = totalQuestions
            ? Math.round(((totalQuestions - wrongCount) / totalQuestions) * 100)
            : 0;
          navigate(`/results/${quiz.id}?score=${score}&wrong=${wrongIds.join(',')}`);
        } else {
          setIndex(nextIndex);
        }
        setSelectedIndex(null);
        setSelectedIndices([]);
        setReveal(false);
        setProcessing(false);
      }, 900);
    } else {
      initiallyWrongRef.current.add(currentQuestion.id);
      
      if (isFillInTheGap) {
        const chosenIndex = typeof overrideIndex === 'number' ? overrideIndex : selectedIndex;
        setFillGapIncorrectIndices((prev) => (
          prev.includes(chosenIndex) ? prev : [...prev, chosenIndex]
        ));
      } else if (isMultiAnswer) {
        // For multi-answer questions, just show "Try again" without disabling
        // User can try again with different selection for this question
      } else {
        // For pure single-answer quiz, disable the incorrect option
        const chosenIndex = typeof overrideIndex === 'number' ? overrideIndex : selectedIndex;
        setDisabledOptions((prev) => {
          const existing = new Set(prev[currentQuestion.id] || []);
          existing.add(chosenIndex);
          return { ...prev, [currentQuestion.id]: Array.from(existing) };
        });
      }
      
      setSelectedIndex(null);
      setSelectedIndices([]);

      // Show transient "Try again" toast for incorrect answer
      setShowTryAgain(true);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = setTimeout(() => {
        setShowTryAgain(false);
      }, 2000);
    }
  };

  const handleOptionClick = (optionIndex) => {
    if (processing || reveal) {
      return;
    }

    if (isFillInTheGap) {
      // For fill-in-the-gap, we don't use this handler
      return;
    } else if (isMultiAnswer) {
      // For multi-answer questions, use checkbox mode for this question
      // Toggle selection
      setSelectedIndices(prev => {
        if (prev.includes(optionIndex)) {
          return prev.filter(idx => idx !== optionIndex);
        } else {
          return [...prev, optionIndex];
        }
      });
    } else {
      // Pure single-answer quiz - immediately submit
      setSelectedIndex(optionIndex);
      handleSubmit(optionIndex);
    }
  };

  if (loading) {
    return <div className="muted">Loading quiz...</div>;
  }

  if (error || !quiz) {
    return <div className="empty">Quiz not found.</div>;
  }

  if (!currentQuestion) {
    return null;
  }

  const disabledForQuestion = new Set(disabledOptions[currentQuestion.id] || []);
  const progress = `${index + 1} / ${totalQuestions}`;

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
        <span className="pill">{quiz.name}</span>
        <span className="muted">{progress}</span>
      </div>
      <div className="card">
        {isFillInTheGap ? (
          <>
            <div className="question">
              {(() => {
                const text = currentQuestion.text || '';
                const delimiter = /_{2,}/g;
                const parts = text.split(delimiter);

                return parts.map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="gap-underline">
                        {reveal
                          ? (fillGapCorrectAnswers[i] || '__________')
                          : (selectedIndices[i] || '__________')}
                      </span>
                    )}
                  </span>
                ));
              })()}
            </div>
            <div className="fill-in-gap-form" style={{ marginTop: '20px', width: '100%' }}>
              <div className="options">
                {fillGapChoices.map((choice, idx) => (
                  (() => {
                    const classNames = ['option'];
                    const originalIndex = fillGapChoiceIndices[idx];

                    if (reveal && originalIndex === correctIndex) {
                      classNames.push('correct');
                    }
                    if (!reveal && selectedIndex === idx) {
                      classNames.push('selected');
                    }
                    if (!reveal && fillGapIncorrectIndices.includes(idx)) {
                      classNames.push('incorrect');
                    }

                    const isDisabled = processing || reveal;

                    return (
                      <button
                        key={idx}
                        type="button"
                        className={classNames.join(' ')}
                        disabled={isDisabled}
                        onClick={() => {
                          if (processing || reveal) return;
                          setSelectedIndex(idx);
                          handleSubmit(idx);
                        }}
                      >
                        {choice}
                      </button>
                    );
                  })()
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="question">
              {currentQuestion.image && (
                <div style={{ marginBottom: '12px' }}>
                  <img
                    src={currentQuestion.image}
                    alt={currentQuestion.text || 'Question image'}
                    style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain' }}
                  />
                </div>
              )}
              {currentQuestion.text}
            </div>
            <div className="options">
              {currentQuestion.options.map((option, optionIndex) => {
                const classNames = ['option'];
                if (disabledForQuestion.has(optionIndex)) {
                  classNames.push('incorrect');
                }
                if (reveal && correctIndices.includes(optionIndex)) {
                  classNames.push('correct');
                }
                if (!reveal && (isMultiAnswer 
                  ? selectedIndices.includes(optionIndex) 
                  : selectedIndex === optionIndex)) {
                  classNames.push('selected');
                }
                const isDisabled = processing || reveal || disabledForQuestion.has(optionIndex);
                return (
                  <button
                    key={optionIndex}
                    type="button"
                    className={classNames.join(' ')}
                    onClick={() => handleOptionClick(optionIndex)}
                    disabled={isDisabled}
                  >
                    {option.image && (
                      <span style={{ display: 'block', marginBottom: option.text ? 8 : 0 }}>
                        <img
                          src={option.image}
                          alt={option.text || `Option ${optionIndex + 1}`}
                          style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain' }}
                        />
                      </span>
                    )}
                    {option.text}
                  </button>
                );
              })}
            </div>
            {isMultiAnswer && (
              <div className="row" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => handleSubmit()}
                  disabled={processing || reveal || selectedIndices.length === 0}
                >
                  Submit
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="footer-actions row" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="btn" onClick={() => setShowQuitDialog(true)}>
          Quit
        </button>
      </div>
      {showTryAgain && (
        <div className="popup popup--danger popup--top" role="alert" aria-live="assertive">
          Try again
        </div>
      )}

      {showQuitDialog && (
        <div className="dialog-overlay" role="presentation" onClick={() => setShowQuitDialog(false)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quit-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="quit-title" className="dialog__title">Are you sure you want to quit?</h3>
            <p className="dialog__body">You will lose your answers.</p>
            <div className="dialog__actions">
              <button type="button" className="btn" onClick={() => setShowQuitDialog(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => navigate(`/quiz/${quiz.id}`)}
                autoFocus
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Play;
