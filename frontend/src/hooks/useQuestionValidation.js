import { useCallback } from 'react';
import { validateGapQuestion, countGaps } from '../utils/gapEncoding';

/**
 * Custom hook for question validation in quiz creation
 * @param {Object} currentQuestion - Question being edited
 * @param {string} selectedQuestionType - Type of question ('basic' or 'fill_gap')
 * @returns {Object} - Validation functions
 */
export function useQuestionValidation(currentQuestion, selectedQuestionType) {
  
  /**
   * Check if current question has any unsaved content
   */
  const hasUnsavedQuestion = useCallback(() => {
    // Check question text
    if (currentQuestion.text.trim()) {
      return true;
    }
    
    // Check options for basic questions
    if (selectedQuestionType === 'basic') {
      if (currentQuestion.options.some((opt) => opt.text.trim())) {
        return true;
      }
    }
    
    // Check gap options for fill-gap questions
    if (selectedQuestionType === 'fill_gap') {
      const gapOptions = Array.isArray(currentQuestion.gapOptions) ? currentQuestion.gapOptions : [];
      for (const gap of gapOptions) {
        const options = Array.isArray(gap?.options) ? gap.options : [];
        if (options.some((opt) => opt.text.trim())) {
          return true;
        }
      }
    }
    
    // Check images
    if (currentQuestion.image_url) {
      return true;
    }
    
    if (currentQuestion.options.some((opt) => opt.image_url)) {
      return true;
    }
    
    // Check explanation
    if (currentQuestion.explanation?.trim()) {
      return true;
    }
    
    return false;
  }, [currentQuestion, selectedQuestionType]);

  /**
   * Validate basic question before saving
   */
  const validateBasicQuestion = useCallback(() => {
    if (!currentQuestion.text.trim()) {
      return { valid: false, error: 'Question text is not filled in' };
    }

    if (currentQuestion.options.length < 2) {
      return { valid: false, error: 'Please add at least 2 options' };
    }

    if (!currentQuestion.options.some((opt) => opt.is_correct)) {
      return { valid: false, error: 'No correct answer is chosen' };
    }

    if (currentQuestion.options.some((opt) => !opt.text.trim())) {
      return { valid: false, error: 'An option text is not filled in' };
    }

    return { valid: true, error: null };
  }, [currentQuestion]);

  /**
   * Validate fill-gap question before saving
   */
  const validateFillGapQuestion = useCallback(() => {
    if (!currentQuestion.text.trim()) {
      return { valid: false, error: 'Question text is not filled in' };
    }

    const gapOptions = Array.isArray(currentQuestion.gapOptions) ? currentQuestion.gapOptions : [];
    return validateGapQuestion(currentQuestion.text, gapOptions);
  }, [currentQuestion]);

  /**
   * Validate current question based on type
   */
  const validateQuestion = useCallback(() => {
    if (selectedQuestionType === 'basic') {
      return validateBasicQuestion();
    } else if (selectedQuestionType === 'fill_gap') {
      return validateFillGapQuestion();
    }
    return { valid: false, error: 'Unknown question type' };
  }, [selectedQuestionType, validateBasicQuestion, validateFillGapQuestion]);

  /**
   * Validate quiz metadata
   */
  const validateMetadata = useCallback((formData) => {
    if (!formData.name.trim()) {
      return { valid: false, error: 'No quiz name' };
    }

    return { valid: true, error: null };
  }, []);

  /**
   * Sync gap options count with underscores in question text
   */
  const syncGapOptionsWithText = useCallback((text, currentGapOptions) => {
    const gapCount = countGaps(text);
    let newGapOptions = Array.isArray(currentGapOptions) ? [...currentGapOptions] : [];

    // Ensure we have one entry per gap
    if (gapCount > newGapOptions.length) {
      for (let i = newGapOptions.length; i < gapCount; i += 1) {
        newGapOptions.push({
          explanation: '',
          options: [
            { text: '', is_correct: false, image_url: '' },
            { text: '', is_correct: false, image_url: '' },
          ],
        });
      }
    } else if (gapCount < newGapOptions.length) {
      newGapOptions = newGapOptions.slice(0, gapCount);
    }

    return newGapOptions;
  }, []);

  return {
    hasUnsavedQuestion,
    validateQuestion,
    validateBasicQuestion,
    validateFillGapQuestion,
    validateMetadata,
    syncGapOptionsWithText,
  };
}
