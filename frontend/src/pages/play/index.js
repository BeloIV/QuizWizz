import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useQuizDetail } from '../../hooks/useQuizDetail';
import { useQuizPlayState } from '../../hooks/useQuizPlayState';
import { isFillGapQuestion as checkIsFillGapQuestion, groupOptionsByGap } from '../../utils/gapEncoding';

import QuestionDisplay from './QuestionDisplay';

/**
 * Main Play component - handles quiz gameplay logic
 */
function Play() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { quiz, loading, error } = useQuizDetail(quizId);
  const [showQuitDialog, setShowQuitDialog] = useState(false);

  // Need a temporary state to hold index before we get it from playState
  const [tempIndex, setTempIndex] = useState(0);
  
  const currentQuestion = useMemo(() => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return null;
    }
    return quiz.questions[tempIndex] || null;
  }, [quiz, tempIndex]);

  const isFillGapQuestion = useMemo(() => {
    return checkIsFillGapQuestion(currentQuestion);
  }, [currentQuestion]);

  // Check if current question has explanation
  const hasExplanation = useMemo(() => {
    if (!currentQuestion?.explanation) return false;
    if (isFillGapQuestion) {
      try {
        const parsed = JSON.parse(currentQuestion.explanation);
        return Object.keys(parsed).length > 0;
      } catch {
        return false;
      }
    }
    return true;
  }, [currentQuestion, isFillGapQuestion]);

  const playState = useQuizPlayState(quiz, currentQuestion, isFillGapQuestion);
  const {
    index,
    setIndex,
    selectedIndex,
    selectedIndices,
    disabledOptions,
    setDisabledOptions,
    reveal,
    setReveal,
    processing,
    setProcessing,
    showTryAgain,
    tempIncorrectIndices,
    setTempIncorrectIndices,
    verifiedCorrectIndices,
    setVerifiedCorrectIndices,
    gapSelections,
    setGapSelections,
    gapTempIncorrect,
    setGapTempIncorrect,
    gapVerifiedCorrect,
    setGapVerifiedCorrect,
    initiallyWrongRef,
    userAnswersRef,
    incorrectAttemptsRef,
    timeoutRef,
    incorrectTimeoutRef,
    quizHasMultiAnswer,
    correctIndices,
    isSubmitDisabled,
    showTryAgainToast,
    handleOptionClick,
    resetQuestionState,
  } = playState;

  const totalQuestions = quiz?.questions?.length || 0;

  // Sync tempIndex with actual index from playState
  useEffect(() => {
    setTempIndex(index);
  }, [index]);

  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions.length === 0 && !loading && !error) {
      const answersParam = encodeURIComponent(JSON.stringify(userAnswersRef.current));
      const incorrectParam = encodeURIComponent(JSON.stringify(incorrectAttemptsRef.current));
      navigate(`/results/${quiz.id}?score=0&wrong=&answers=${answersParam}&incorrect=${incorrectParam}`);
    }
  }, [quiz, loading, error, navigate]);

  const handleSubmit = (overrideIndex) => {
    if (!quiz || !currentQuestion || processing || reveal) {
      return;
    }

    let isCorrect = false;

    if (isFillGapQuestion) {
      const gapMap = groupOptionsByGap(currentQuestion.options || []);
      const gapIndices = Array.from(gapMap.keys()).sort((a, b) => a - b);
      if (gapIndices.length === 0) {
        return;
      }

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
      userAnswersRef.current[currentQuestion.id] = { ...gapSelections };

      if (isCorrect) {
        setGapVerifiedCorrect(Array.from(gapIndices));
        setGapTempIncorrect([]);

        setReveal(true);
        
        // If there's an explanation, don't auto-advance - wait for user to click Continue
        if (hasExplanation) {
          setProcessing(false);
        } else {
          // No explanation, auto-advance after short delay
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
              resetQuestionState();
              setIndex(nextIndex);
            }
          }, 900);
        }
      } else {
        initiallyWrongRef.current.add(currentQuestion.id);

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

        showTryAgainToast();
      }

      return;
    }

    if (quizHasMultiAnswer) {
      const selectedSet = new Set(selectedIndices);
      const correctSet = new Set(correctIndices);
      isCorrect = selectedSet.size === correctSet.size &&
        [...selectedSet].every(idx => correctSet.has(idx));
      
      userAnswersRef.current[currentQuestion.id] = [...selectedIndices];
    } else {
      const correctIndex = currentQuestion?.correct_index;
      const chosenIndex = typeof overrideIndex === 'number' ? overrideIndex : selectedIndex;
      if (chosenIndex === null || chosenIndex === undefined) {
        return;
      }
      isCorrect = chosenIndex === correctIndex;
      userAnswersRef.current[currentQuestion.id] = chosenIndex;
    }

    if (isCorrect) {
      setReveal(true);
      
      // If there's an explanation, don't auto-advance - wait for user to click Continue
      if (hasExplanation) {
        setProcessing(false);
      } else {
        // No explanation, auto-advance after short delay
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
            resetQuestionState();
            setIndex(nextIndex);
          }
        }, 900);
      }
    } else {
      initiallyWrongRef.current.add(currentQuestion.id);

      if (quizHasMultiAnswer) {
        if (!incorrectAttemptsRef.current[currentQuestion.id]) {
          incorrectAttemptsRef.current[currentQuestion.id] = [];
        }
        incorrectAttemptsRef.current[currentQuestion.id].push([...selectedIndices]);

        const correctSet = new Set(correctIndices);
        const incorrectlySelected = selectedIndices.filter(idx => !correctSet.has(idx));
        const newSelectedIndices = selectedIndices.filter(idx => correctSet.has(idx));

        setTempIncorrectIndices(incorrectlySelected);
        setVerifiedCorrectIndices((prev) => {
          const next = new Set(prev);
          newSelectedIndices.forEach(idx => next.add(idx));
          return Array.from(next);
        });

        if (incorrectTimeoutRef.current) {
          clearTimeout(incorrectTimeoutRef.current);
        }
        incorrectTimeoutRef.current = setTimeout(() => {
          setTempIncorrectIndices([]);
        }, 2000);
      } else {
        const chosenIndex = typeof overrideIndex === 'number' ? overrideIndex : selectedIndex;
        if (!incorrectAttemptsRef.current[currentQuestion.id]) {
          incorrectAttemptsRef.current[currentQuestion.id] = [];
        }
        incorrectAttemptsRef.current[currentQuestion.id].push(chosenIndex);

        setDisabledOptions((prev) => {
          const existing = new Set(prev[currentQuestion.id] || []);
          existing.add(chosenIndex);
          return { ...prev, [currentQuestion.id]: Array.from(existing) };
        });
      }

      showTryAgainToast();
    }
  };

  const handleGapSelectionChange = (gIdx, value) => {
    setGapSelections((prev) => ({ ...prev, [gIdx]: value }));
  };

  const handleContinueToNext = () => {
    if (!reveal) return;
    
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
      resetQuestionState();
      setIndex(nextIndex);
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
    <div style={{ paddingBottom: '80px' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
        <span className="pill">{quiz.name}</span>
        <span className="muted">{progress}</span>
      </div>

      <QuestionDisplay
        currentQuestion={currentQuestion}
        isFillGapQuestion={isFillGapQuestion}
        quizHasMultiAnswer={quizHasMultiAnswer}
        selectedIndex={selectedIndex}
        selectedIndices={selectedIndices}
        verifiedCorrectIndices={verifiedCorrectIndices}
        tempIncorrectIndices={tempIncorrectIndices}
        disabledForQuestion={disabledForQuestion}
        reveal={reveal}
        correctIndices={correctIndices}
        processing={processing}
        isSubmitDisabled={isSubmitDisabled}
        gapSelections={gapSelections}
        gapTempIncorrect={gapTempIncorrect}
        gapVerifiedCorrect={gapVerifiedCorrect}
        onOptionClick={handleOptionClick}
        onGapSelectionChange={handleGapSelectionChange}
        onSubmit={handleSubmit}
      />

      <div className="footer-actions row" style={{ position: 'fixed', bottom: '70px', left: 0, right: 0, padding: '16px', backgroundColor: 'var(--background, var(--bg, #fff))', borderTop: '1px solid var(--border, rgba(0, 0, 0, 0.1))', justifyContent: 'space-between', zIndex: 10 }}>
        <button type="button" className="btn btn-secondary" onClick={() => setShowQuitDialog(true)}>
          Quit
        </button>
        {!reveal ? (
          <button
            type="button"
            className="btn primary"
            onClick={() => handleSubmit()}
            disabled={isSubmitDisabled}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="btn primary"
            onClick={handleContinueToNext}
          >
            Continue
          </button>
        )}
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
