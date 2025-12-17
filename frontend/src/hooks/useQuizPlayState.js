import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { countGaps } from '../utils/gapEncoding';

/**
 * Custom hook to manage quiz play state including selections, answers, and validation
 * @param {Object} quiz - Quiz object with questions
 * @param {Object} currentQuestion - Current question being displayed
 * @param {boolean} isFillGapQuestion - Whether current question is fill-gap type
 * @returns {Object} - State and handlers for quiz play
 */
export function useQuizPlayState(quiz, currentQuestion, isFillGapQuestion) {
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [disabledOptions, setDisabledOptions] = useState({});
  const [reveal, setReveal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [tempIncorrectIndices, setTempIncorrectIndices] = useState([]);
  const [verifiedCorrectIndices, setVerifiedCorrectIndices] = useState([]);
  const [gapSelections, setGapSelections] = useState({});
  const [gapTempIncorrect, setGapTempIncorrect] = useState([]);
  const [gapVerifiedCorrect, setGapVerifiedCorrect] = useState([]);
  
  const initiallyWrongRef = useRef(new Set());
  const userAnswersRef = useRef({});
  const incorrectAttemptsRef = useRef({});
  const timeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const incorrectTimeoutRef = useRef(null);

  // Check if quiz has any multi-answer questions
  const quizHasMultiAnswer = useMemo(() => {
    if (!quiz?.questions) return false;
    return quiz.questions.some(q => {
      const correctCount = q.options?.filter(opt => opt.is_correct).length || 0;
      return correctCount > 1;
    });
  }, [quiz]);

  // Determine if current question has multiple correct answers
  const isMultiAnswer = useMemo(() => {
    if (!currentQuestion?.options || isFillGapQuestion) return false;
    const correctCount = currentQuestion.options.filter(opt => opt.is_correct).length;
    return correctCount > 1;
  }, [currentQuestion, isFillGapQuestion]);

  const correctIndices = useMemo(() => {
    if (!currentQuestion?.options || isFillGapQuestion) return [];
    return currentQuestion.options
      .filter(opt => opt.is_correct)
      .map(opt => opt.index);
  }, [currentQuestion, isFillGapQuestion]);

  // Reset state when quiz changes
  useEffect(() => {
    setIndex(0);
    setSelectedIndex(null);
    setSelectedIndices([]);
    setDisabledOptions({});
    setReveal(false);
    setProcessing(false);
    setTempIncorrectIndices([]);
    setVerifiedCorrectIndices([]);
    setGapSelections({});
    setGapTempIncorrect([]);
    setGapVerifiedCorrect([]);
    initiallyWrongRef.current = new Set();
    userAnswersRef.current = {};
    incorrectAttemptsRef.current = {};
    
    // Clear all timeouts
    [timeoutRef, toastTimeoutRef, incorrectTimeoutRef].forEach(ref => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    });
  }, [quiz?.id]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      [timeoutRef, toastTimeoutRef, incorrectTimeoutRef].forEach(ref => {
        if (ref.current) clearTimeout(ref.current);
      });
    };
  }, []);

  // Reset selections when moving to next question
  const resetQuestionState = useCallback(() => {
    setSelectedIndex(null);
    setSelectedIndices([]);
    setGapSelections({});
    setGapTempIncorrect([]);
    setGapVerifiedCorrect([]);
    setVerifiedCorrectIndices([]);
    setReveal(false);
    setProcessing(false);
  }, []);

  // Show temporary "try again" toast
  const showTryAgainToast = useCallback(() => {
    setShowTryAgain(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowTryAgain(false);
    }, 2000);
  }, []);

  // Handle option click for basic questions
  const handleOptionClick = useCallback((optionIndex) => {
    if (processing || reveal) return;

    if (quizHasMultiAnswer) {
      // Prevent deselecting verified correct answers
      if (verifiedCorrectIndices.includes(optionIndex)) return;
      
      // Toggle selection
      setSelectedIndices(prev => {
        if (prev.includes(optionIndex)) {
          return prev.filter(idx => idx !== optionIndex);
        } else {
          return [...prev, optionIndex];
        }
      });
    } else {
      // Single-answer mode
      setSelectedIndex(optionIndex);
    }
  }, [processing, reveal, quizHasMultiAnswer, verifiedCorrectIndices]);

  // Check if submit button should be disabled
  const isSubmitDisabled = useMemo(() => {
    if (processing) return true;
    
    if (isFillGapQuestion) {
      const gapCount = countGaps(currentQuestion?.text || '');
      if (gapCount === 0) return true;
      for (let g = 0; g < gapCount; g += 1) {
        if (gapSelections[g] === undefined || gapSelections[g] === null) {
          return true;
        }
      }
      return false;
    }
    
    if (quizHasMultiAnswer) {
      return selectedIndices.length === 0;
    }
    
    return selectedIndex === null;
  }, [processing, isFillGapQuestion, currentQuestion, gapSelections, quizHasMultiAnswer, selectedIndices, selectedIndex]);

  return {
    // State
    index,
    setIndex,
    selectedIndex,
    setSelectedIndex,
    selectedIndices,
    setSelectedIndices,
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
    
    // Refs
    initiallyWrongRef,
    userAnswersRef,
    incorrectAttemptsRef,
    timeoutRef,
    toastTimeoutRef,
    incorrectTimeoutRef,
    
    // Computed
    quizHasMultiAnswer,
    isMultiAnswer,
    correctIndices,
    isSubmitDisabled,
    
    // Methods
    resetQuestionState,
    showTryAgainToast,
    handleOptionClick,
  };
}
