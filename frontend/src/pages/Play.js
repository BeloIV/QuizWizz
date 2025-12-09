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
  const [verifiedCorrectIndices, setVerifiedCorrectIndices] = useState([]); // Keep correct answers green
  const initiallyWrongRef = useRef(new Set());
  const userAnswersRef = useRef({}); // Track user's final answers for each question
  const incorrectAttemptsRef = useRef({}); // Track all incorrect attempts for each question
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
    setVerifiedCorrectIndices([]);
    initiallyWrongRef.current = new Set();
    userAnswersRef.current = {};
    incorrectAttemptsRef.current = {};
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

  const isFillGapQuestion = useMemo(() => {
    if (!currentQuestion) return false;
    if (!currentQuestion.text || typeof currentQuestion.text !== 'string') return false;
    if (!Array.isArray(currentQuestion.options) || currentQuestion.options.length === 0) return false;
    const hasGap = /_{1,}/.test(currentQuestion.text);
    const hasEncodedOptions = currentQuestion.options.some((opt) => typeof opt.text === 'string' && /^__G\d+__/.test(opt.text));
    return hasGap && hasEncodedOptions;
  }, [currentQuestion]);

  // Check if the entire quiz has at least one multi-answer question
  const quizHasMultiAnswer = useMemo(() => {
    if (!quiz?.questions) return false;
    return quiz.questions.some(q => {
      const correctCount = q.options?.filter(opt => opt.is_correct).length || 0;
      return correctCount > 1;
    });
  }, [quiz]);

  // Determine if current question has multiple correct answers (for basic/multi-select questions)
  const isMultiAnswer = useMemo(() => {
    if (!currentQuestion?.options || isFillGapQuestion) return false;
    const correctCount = currentQuestion.options.filter(opt => opt.is_correct).length;
    return correctCount > 1;
  }, [currentQuestion, isFillGapQuestion]);

  const correctIndex = currentQuestion?.correct_index;
  const correctIndices = useMemo(() => {
    if (!currentQuestion?.options || isFillGapQuestion) return [];
    return currentQuestion.options
      .filter(opt => opt.is_correct)
      .map(opt => opt.index);
  }, [currentQuestion, isFillGapQuestion]);
  const totalQuestions = quiz?.questions?.length || 0;

  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions.length === 0 && !loading && !error) {
      const answersParam = encodeURIComponent(JSON.stringify(userAnswersRef.current));
      const incorrectParam = encodeURIComponent(JSON.stringify(incorrectAttemptsRef.current));
      navigate(`/results/${quiz.id}?score=0&wrong=&answers=${answersParam}&incorrect=${incorrectParam}`);
    }
  }, [quiz, loading, error, navigate]);

  const [gapSelections, setGapSelections] = useState({}); // { [gapIndex]: optionGlobalIndex }
  const [gapTempIncorrect, setGapTempIncorrect] = useState([]); // gaps to highlight as incorrect
  const [gapVerifiedCorrect, setGapVerifiedCorrect] = useState([]); // gaps that were answered correctly

  const handleSubmit = (overrideIndex) => {
    if (!quiz || !currentQuestion || processing || reveal) {
      return;
    }

    let isCorrect = false;

    if (isFillGapQuestion) {
      // Decode gap groups from encoded options: __G{gapIndex}__Option text
      const gapMap = new Map(); // gapIndex -> [{ option, globalIndex }]
      (currentQuestion.options || []).forEach((opt) => {
        if (typeof opt.text !== 'string') return;
        const match = opt.text.match(/^__G(\d+)__(.*)$/);
        if (!match) return;
        const gIdx = parseInt(match[1], 10);
        if (!gapMap.has(gIdx)) {
          gapMap.set(gIdx, []);
        }
        gapMap.get(gIdx).push({ option: opt, globalIndex: opt.index });
      });

      const gapIndices = Array.from(gapMap.keys()).sort((a, b) => a - b);
      if (gapIndices.length === 0) {
        return;
      }

      // Ensure all gaps have a selection
      for (const gIdx of gapIndices) {
        if (gapSelections[gIdx] === undefined || gapSelections[gIdx] === null) {
          return;
        }
      }

      const newlyIncorrectGaps = [];
      const newlyCorrectGaps = [];

      gapIndices.forEach((gIdx) => {
        const selectedGlobalIndex = gapSelections[gIdx];
        const optionsForGap = gapMap.get(gIdx) || [];
        const selectedEntry = optionsForGap.find((entry) => entry.globalIndex === selectedGlobalIndex);
        if (!selectedEntry) {
          newlyIncorrectGaps.push(gIdx);
          return;
        }
        if (selectedEntry.option.is_correct) {
          newlyCorrectGaps.push(gIdx);
        } else {
          newlyIncorrectGaps.push(gIdx);
        }
      });

      isCorrect = newlyIncorrectGaps.length === 0;

      // Save user's answer for this question
      userAnswersRef.current[currentQuestion.id] = { ...gapSelections };

      if (isCorrect) {
        // Mark all gaps as correctly answered so their dropdowns highlight in green
        setGapVerifiedCorrect(Array.from(gapIndices));
        setGapTempIncorrect([]);

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
            const answersParam = encodeURIComponent(JSON.stringify(userAnswersRef.current));
            const incorrectParam = encodeURIComponent(JSON.stringify(incorrectAttemptsRef.current));
            navigate(`/results/${quiz.id}?score=${score}&wrong=${wrongIds.join(',')}&answers=${answersParam}&incorrect=${incorrectParam}`);
          } else {
            setIndex(nextIndex);
          }
          setSelectedIndex(null);
          setSelectedIndices([]);
          setGapSelections({});
          setGapTempIncorrect([]);
          setGapVerifiedCorrect([]);
          setVerifiedCorrectIndices([]);
          setReveal(false);
          setProcessing(false);
        }, 900);
      } else {
        initiallyWrongRef.current.add(currentQuestion.id);

        // Record incorrect gap attempts
        if (!incorrectAttemptsRef.current[currentQuestion.id]) {
          incorrectAttemptsRef.current[currentQuestion.id] = [];
        }
        incorrectAttemptsRef.current[currentQuestion.id].push({ ...gapSelections });

        setGapTempIncorrect(newlyIncorrectGaps);
        setGapVerifiedCorrect((prev) => {
          const next = new Set(prev);
          newlyCorrectGaps.forEach((gIdx) => next.add(gIdx));
          return Array.from(next);
        });

        if (incorrectTimeoutRef.current) {
          clearTimeout(incorrectTimeoutRef.current);
        }
        incorrectTimeoutRef.current = setTimeout(() => {
          setGapTempIncorrect([]);
        }, 2000);

        setShowTryAgain(true);
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = setTimeout(() => {
          setShowTryAgain(false);
        }, 2000);
      }

      return;
    }

    if (quizHasMultiAnswer) {
      // If quiz has any multi-answer questions, all questions use checkbox mode
      // Check if selectedIndices match correctIndices
      const selectedSet = new Set(selectedIndices);
      const correctSet = new Set(correctIndices);
      isCorrect = selectedSet.size === correctSet.size &&
        [...selectedSet].every(idx => correctSet.has(idx));
      
      // Save user's answer
      userAnswersRef.current[currentQuestion.id] = [...selectedIndices];
    } else {
      // Pure single-answer quiz - use old behavior
      const chosenIndex = typeof overrideIndex === 'number' ? overrideIndex : selectedIndex;
      if (chosenIndex === null || chosenIndex === undefined) {
        return;
      }
      isCorrect = chosenIndex === correctIndex;
      
      // Save user's answer
      userAnswersRef.current[currentQuestion.id] = chosenIndex;
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
          const answersParam = encodeURIComponent(JSON.stringify(userAnswersRef.current));
          const incorrectParam = encodeURIComponent(JSON.stringify(incorrectAttemptsRef.current));
          navigate(`/results/${quiz.id}?score=${score}&wrong=${wrongIds.join(',')}&answers=${answersParam}&incorrect=${incorrectParam}`);
        } else {
          setIndex(nextIndex);
        }
        setSelectedIndex(null);
        setSelectedIndices([]);
        setVerifiedCorrectIndices([]); // Reset verified correct answers for next question
        setReveal(false);
        setProcessing(false);
      }, 900);
    } else {
      initiallyWrongRef.current.add(currentQuestion.id);

      if (quizHasMultiAnswer) {
        // Record incorrect multi-answer attempt
        if (!incorrectAttemptsRef.current[currentQuestion.id]) {
          incorrectAttemptsRef.current[currentQuestion.id] = [];
        }
        incorrectAttemptsRef.current[currentQuestion.id].push([...selectedIndices]);

        // For quiz with multi-answer, keep correct selections and show incorrect ones in red temporarily
        const correctSet = new Set(correctIndices);
        const incorrectlySelected = selectedIndices.filter(idx => !correctSet.has(idx));
        const newSelectedIndices = selectedIndices.filter(idx => correctSet.has(idx));

        // Show incorrect answers in red
        setTempIncorrectIndices(incorrectlySelected);

        // Keep only correct selections and mark them as verified correct
        setSelectedIndices(newSelectedIndices);
        setVerifiedCorrectIndices((prev) => {
          const next = new Set(prev);
          newSelectedIndices.forEach(idx => next.add(idx));
          return Array.from(next);
        });

        // Clear incorrect highlighting after 2 seconds
        if (incorrectTimeoutRef.current) {
          clearTimeout(incorrectTimeoutRef.current);
        }
        incorrectTimeoutRef.current = setTimeout(() => {
          setTempIncorrectIndices([]);
        }, 2000);
      } else {
        // Record incorrect single-answer attempt
        const chosenIndex = typeof overrideIndex === 'number' ? overrideIndex : selectedIndex;
        if (!incorrectAttemptsRef.current[currentQuestion.id]) {
          incorrectAttemptsRef.current[currentQuestion.id] = [];
        }
        incorrectAttemptsRef.current[currentQuestion.id].push(chosenIndex);

        // For pure single-answer quiz, disable the incorrect option
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
      // Prevent deselecting verified correct answers
      if (verifiedCorrectIndices.includes(optionIndex)) {
        return;
      }
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
        {currentQuestion.image_url && (
          <div className="question-image-wrapper">
            <img src={currentQuestion.image_url} alt="Question" className="question-image" />
          </div>
        )}
          <div className="question">
            {isFillGapQuestion ? (
              (() => {
                const parts = currentQuestion.text.split(/(_{1,})/);
                const gapMap = new Map();
                (currentQuestion.options || []).forEach((opt) => {
                  if (typeof opt.text !== 'string') return;
                  const match = opt.text.match(/^__G(\d+)__(.*)$/);
                  if (!match) return;
                  const gIdx = parseInt(match[1], 10);
                  if (!gapMap.has(gIdx)) {
                    gapMap.set(gIdx, []);
                  }
                  gapMap.get(gIdx).push({ option: opt, label: match[2], globalIndex: opt.index });
                });
                const gapIndices = Array.from(gapMap.keys()).sort((a, b) => a - b);

                let gapCounter = 0;
                const rendered = [];
                for (let i = 0; i < parts.length; i += 1) {
                  const part = parts[i];
                  if (part.match(/^_{1,}$/)) {
                    const gIdx = gapCounter;
                    const optionsForGap = gapMap.get(gIdx) || [];
                    const selectValue = gapSelections[gIdx] ?? '';
                    const isIncorrect = gapTempIncorrect.includes(gIdx);
                    const isCorrect = gapVerifiedCorrect.includes(gIdx);
                    const selectClassNames = ['gap-select'];
                    if (isIncorrect) selectClassNames.push('incorrect');
                    if (isCorrect) selectClassNames.push('correct');

                    rendered.push(
                      <select
                        key={`gap-${gIdx}`}
                        className={selectClassNames.join(' ')}
                        value={selectValue}
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : Number(e.target.value);
                          setGapSelections((prev) => ({ ...prev, [gIdx]: value }));
                        }}
                        disabled={processing || reveal}
                      >
                        <option value="">Select...</option>
                        {optionsForGap.map((entry) => (
                          <option key={entry.globalIndex} value={entry.globalIndex}>
                            {entry.label}
                          </option>
                        ))}
                      </select>
                    );
                    gapCounter += 1;
                  } else if (part) {
                    rendered.push(
                      <span key={`text-${i}`}>{part}</span>
                    );
                  }
                }
                return rendered;
              })()
            ) : (
              currentQuestion.text
            )}
          </div>
        {quizHasMultiAnswer && !isFillGapQuestion && (
          <div className="muted" style={{ fontSize: '14px', marginBottom: '12px' }}>
            Select all correct answers
          </div>
        )}
        {!isFillGapQuestion && (
          <div className="options" id="options">
            {currentQuestion.options.map((option) => {
              const optionIndex = option.index;
              const classNames = ['option'];
              if (disabledForQuestion.has(optionIndex)) {
                classNames.push('incorrect');
              }
              if (reveal && correctIndices.includes(optionIndex)) {
                classNames.push('correct');
              } else if (quizHasMultiAnswer && verifiedCorrectIndices.includes(optionIndex)) {
                // Keep verified correct answers green
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
                  {option.image_url && (
                    <span className="option-image-wrapper">
                      <img src={option.image_url} alt={option.text} className="option-image" />
                    </span>
                  )}
                  <span className="option-text">{option.text}</span>
                </button>
              );
            })}
          </div>
        )}
        {!reveal && (
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="btn primary"
              onClick={() => handleSubmit()}
              disabled={
                processing ||
                (isFillGapQuestion
                  ? (() => {
                      const textValue = currentQuestion.text || '';
                      const gapMatches = textValue.match(/_{1,}/g) || [];
                      const gapCount = gapMatches.length;
                      if (gapCount === 0) return true;
                      for (let g = 0; g < gapCount; g += 1) {
                        if (gapSelections[g] === undefined || gapSelections[g] === null) {
                          return true;
                        }
                      }
                      return false;
                    })()
                  : quizHasMultiAnswer
                    ? selectedIndices.length === 0
                    : selectedIndex === null)
              }
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
