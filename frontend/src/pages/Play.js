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
  const [tempIncorrectIndices, setTempIncorrectIndices] = useState([]); // Temporarily show incorrect answers in red
  const initiallyWrongRef = useRef(new Set());
  const timeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const incorrectTimeoutRef = useRef(null);

  useEffect(() => {
    setIndex(0);
    setSelectedIndex(null);
    setSelectedIndices([]);
    setDisabledOptions({});
    setReveal(false);
    setProcessing(false);
    setTempIncorrectIndices([]);
    initiallyWrongRef.current = new Set();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    if (incorrectTimeoutRef.current) {
      clearTimeout(incorrectTimeoutRef.current);
      incorrectTimeoutRef.current = null;
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
      if (incorrectTimeoutRef.current) {
        clearTimeout(incorrectTimeoutRef.current);
      }
    };
  }, []);

  const currentQuestion = useMemo(() => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return null;
    }
    return quiz.questions[index] || null;
  }, [quiz, index]);

  // Check if the entire quiz has at least one multi-answer question
  const quizHasMultiAnswer = useMemo(() => {
    if (!quiz?.questions) return false;
    return quiz.questions.some(q => {
      const correctCount = q.options?.filter(opt => opt.is_correct).length || 0;
      return correctCount > 1;
    });
  }, [quiz]);

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

  const handleSubmit = (overrideIndex) => {
    if (!quiz || !currentQuestion || processing || reveal) {
      return;
    }

    let isCorrect = false;

    if (quizHasMultiAnswer) {
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
        // For quiz with multi-answer, keep correct selections and show incorrect ones in red temporarily
        const correctSet = new Set(correctIndices);
        const incorrectlySelected = selectedIndices.filter(idx => !correctSet.has(idx));
        const newSelectedIndices = selectedIndices.filter(idx => correctSet.has(idx));

        // Show incorrect answers in red
        setTempIncorrectIndices(incorrectlySelected);

        // Keep only correct selections
        setSelectedIndices(newSelectedIndices);

        // Clear incorrect highlighting after 2 seconds
        if (incorrectTimeoutRef.current) {
          clearTimeout(incorrectTimeoutRef.current);
        }
        incorrectTimeoutRef.current = setTimeout(() => {
          setTempIncorrectIndices([]);
        }, 2000);
      } else {
        // For pure single-answer quiz, disable the incorrect option
        const chosenIndex = typeof overrideIndex === 'number' ? overrideIndex : selectedIndex;
        setDisabledOptions((prev) => {
          const existing = new Set(prev[currentQuestion.id] || []);
          existing.add(chosenIndex);
          return { ...prev, [currentQuestion.id]: Array.from(existing) };
        });
        setSelectedIndex(null);
      }

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

    if (quizHasMultiAnswer) {
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
      // Pure single-answer quiz - just set selection, don't auto-submit
      setSelectedIndex(optionIndex);
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
        <div className="question">{currentQuestion.text}</div>
        {quizHasMultiAnswer && (
          <div className="muted" style={{ fontSize: '14px', marginBottom: '12px' }}>
            Select all correct answers
          </div>
        )}
        <div className="options" id="options">
          {currentQuestion.options.map((option) => {
            const optionIndex = option.index;
            const classNames = ['option'];
            if (disabledForQuestion.has(optionIndex)) {
              classNames.push('incorrect');
            }
            if (reveal && correctIndices.includes(optionIndex)) {
              classNames.push('correct');
            }
            if (quizHasMultiAnswer) {
              if (selectedIndices.includes(optionIndex)) {
                classNames.push('selected');
              }
              // Add temporary incorrect highlighting
              if (tempIncorrectIndices.includes(optionIndex)) {
                classNames.push('incorrect');
              }
            } else {
              if (selectedIndex === optionIndex) {
                classNames.push('selected');
              }
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
                {option.text}
              </button>
            );
          })}
        </div>
        {!reveal && (
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="btn primary"
              onClick={() => handleSubmit()}
              disabled={processing || (quizHasMultiAnswer ? selectedIndices.length === 0 : selectedIndex === null)}
              style={{ width: '100%' }}
            >
              Continue
            </button>
          </div>
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
