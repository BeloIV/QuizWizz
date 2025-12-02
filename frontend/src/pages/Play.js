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

  // Check if the entire quiz has any multi-answer or fill-in-the-gap questions
  const quizHasMultiAnswer = useMemo(() => {
    if (!quiz?.questions) return false;
    return quiz.questions.some(q => {
      if (q.question_type === 'FILL_IN_THE_GAP') return true;
      const correctCount = q.options?.filter(opt => opt.is_correct).length || 0;
      return correctCount > 1;
    });
  }, [quiz]);

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

  const handleFillInTheGapSubmit = (e) => {
    e.preventDefault();
    if (!selectedIndices[0]?.trim()) {
      return;
    }
    handleSubmit();
  };

  const handleSubmit = (overrideIndex) => {
    if (!quiz || !currentQuestion || processing || reveal) {
      return;
    }

    let isCorrect = false;

    if (isFillInTheGap) {
      // Handle fill-in-the-gap question
      const userAnswer = selectedIndices[0]?.toLowerCase().trim();
      const correctAnswers = currentQuestion.options[0]?.text.split(';').map(s => s.trim().toLowerCase()) || [];
      
      // Check if the answer is in the correct answers list
      isCorrect = correctAnswers.some(answer => answer === userAnswer);
      
      // If not correct, check if it matches any incorrect answers
      if (!isCorrect) {
        const incorrectAnswers = currentQuestion.options
          .slice(1) // Skip the first option (correct answers)
          .map(opt => opt.text.toLowerCase().trim())
          .filter(Boolean); // Remove empty strings
          
        // If the answer matches any incorrect answer, show the correct answer
        if (incorrectAnswers.includes(userAnswer)) {
          isCorrect = false;
        }
      }
    } else if (quizHasMultiAnswer) {
      // If quiz has any multi-answer questions, all questions use checkbox mode
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
      
      if (quizHasMultiAnswer) {
        // For quiz with multi-answer, just show "Try again" without disabling
        // User can try again with different selection
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
    } else if (quizHasMultiAnswer) {
      // If quiz has any multi-answer questions, all questions use checkbox mode
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
              {currentQuestion.text.split('_____').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="gap-underline">
                      {reveal ? currentQuestion.options[0]?.text.split(';')[0] : '__________'}
                    </span>
                  )}
                </span>
              ))}
            </div>
            <form onSubmit={handleFillInTheGapSubmit} className="fill-in-gap-form" style={{ marginTop: '20px' }}>
              <input
                type="text"
                value={selectedIndices[0] || ''}
                onChange={(e) => setSelectedIndices([e.target.value])}
                placeholder="Type your answer here"
                disabled={processing || reveal}
                className="fill-in-gap-input"
                autoFocus
                list="possible-answers"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  marginBottom: '10px'
                }}
              />
              <datalist id="possible-answers">
                {currentQuestion.options.slice(1).map((option, idx) => (
                  option.text.trim() && (
                    <option key={`incorrect-${idx}`} value={option.text} />
                  )
                ))}
              </datalist>
              <button 
                type="submit" 
                className="btn primary"
                disabled={processing || reveal || !selectedIndices[0]?.trim()}
                style={{ width: '100%' }}
              >
                Submit
              </button>
              {reveal && (
                <div className="feedback" style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  borderRadius: '4px', 
                  backgroundColor: correctIndices.length > 0 ? '#e8f5e9' : '#ffebee',
                  color: correctIndices.length > 0 ? '#2e7d32' : '#c62828'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
                    {correctIndices.length > 0 ? '✅ Correct!' : '❌ Incorrect'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9em' }}>
                    The correct answer is: <strong>{currentQuestion.options[0]?.text.split(';')[0]}</strong>
                  </p>
                </div>
              )}
            </form>
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
                if (!reveal && (quizHasMultiAnswer 
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
