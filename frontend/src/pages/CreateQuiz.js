import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQuizList } from '../context/QuizContext';
import { API_BASE_URL } from '../config';

function CreateQuiz() {
  const navigate = useNavigate();
  const { createQuiz } = useQuizList();

  const [screen, setScreen] = useState('metadata'); // 'metadata' or 'questions'

  const [formData, setFormData] = useState({
    name: '',
    author: '',
    icon: '📝',
    tags: [],
    questions: [],
  });

  // Questions will be added dynamically without pre-set count

  // Question type selection state - Basic is selected by default
  const [questionTypeSelected, setQuestionTypeSelected] = useState(true);
  const [selectedQuestionType, setSelectedQuestionType] = useState('basic'); // 'basic' or 'fill_gap'

  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    image_url: '',
    explanation: '',
    options: [
      { text: '', is_correct: false, image_url: '' },
      { text: '', is_correct: false, image_url: '' },
    ],
    gapOptions: [], // For fill-in-the-gap questions: array of gaps, each with its own options
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [popup, setPopup] = useState(null); // { message: string, type: 'warning' | 'success' }
  const popupTimeoutRef = useRef(null);

  const fileInputRef = useRef(null);
  const [imageTarget, setImageTarget] = useState(null); // { type: 'question' | 'option', index?: number }

  // Auto-dismiss popup after 2 seconds
  useEffect(() => {
    if (popup) {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
      popupTimeoutRef.current = setTimeout(() => {
        setPopup(null);
      }, 2000);
    }
    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, [popup]);

  const handleQuizChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const uploadImage = useCallback(
    async (file) => {
      const maxSize = 50 * 1024 * 1024;

      if (!file) {
        throw new Error('No file selected');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Selected file is not an image');
      }

      if (file.size > maxSize) {
        throw new Error('Image is too large (max 50MB)');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload-image/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = errorData.detail || `Image upload failed (${response.status})`;
        throw new Error(detail);
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error('Upload response did not contain image URL');
      }

      return data.url;
    },
    []
  );

  const handleImageFileChange = useCallback(
    async (e) => {
      const file = e.target.files && e.target.files[0];
      // Reset input so the same file can be chosen again
      e.target.value = '';

      if (!file || !imageTarget) {
        return;
      }

      try {
        const url = await uploadImage(file);

        if (imageTarget.type === 'question') {
          setCurrentQuestion((prev) => ({ ...prev, image_url: url }));
        } else if (imageTarget.type === 'option' && typeof imageTarget.index === 'number') {
          setCurrentQuestion((prev) => {
            const options = [...prev.options];
            if (options[imageTarget.index]) {
              options[imageTarget.index] = {
                ...options[imageTarget.index],
                image_url: url,
              };
            }
            return { ...prev, options };
          });
        }
      } catch (err) {
        setPopup({ message: err.message || 'Failed to upload image', type: 'warning' });
      } finally {
        setImageTarget(null);
      }
    },
    [imageTarget, uploadImage]
  );

  const handleImageButtonClick = useCallback(
    (target) => {
      if (target.type === 'question') {
        if (currentQuestion.image_url) {
          setCurrentQuestion((prev) => ({ ...prev, image_url: '' }));
          return;
        }
      } else if (target.type === 'option' && typeof target.index === 'number') {
        const existing = currentQuestion.options[target.index];
        if (existing?.image_url) {
          setCurrentQuestion((prev) => {
            const options = [...prev.options];
            if (options[target.index]) {
              options[target.index] = { ...options[target.index], image_url: '' };
            }
            return { ...prev, options };
          });
          return;
        }
      }

      setImageTarget(target);
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    },
    [currentQuestion]
  );

  const handleQuestionChange = useCallback((e) => {
    const { name, value } = e.target;

    console.log('name', name, value, selectedQuestionType)

    // For basic questions, just update as before
    if (selectedQuestionType === 'basic') {
      setCurrentQuestion((prev) => ({ ...prev, [name]: value }));
      return;
    }

    // For fill-in-the-gap questions, keep gap definitions in sync with underscores
    if (name === 'text' && selectedQuestionType === 'fill_gap') {
      const textValue = value;
      const gapMatches = textValue.match(/_{1,}/g) || [];
      const gapCount = gapMatches.length;

      setCurrentQuestion((prev) => {
        let newGapOptions = Array.isArray(prev.gapOptions) ? [...prev.gapOptions] : [];

        console.log('gapCount', gapCount);
        console.log('newGapOptions.length', newGapOptions.length);
        // Ensure we have one entry per gap
        if (gapCount > newGapOptions.length) {
          for (let i = newGapOptions.length; i < gapCount; i += 1) {
            newGapOptions.push({
              options: [
                { text: '', is_correct: false, image_url: '' },
                { text: '', is_correct: false, image_url: '' },
              ],
            });
          }
        } else if (gapCount < newGapOptions.length) {
          newGapOptions = newGapOptions.slice(0, gapCount);
        }

        return {
          ...prev,
          text: textValue,
          gapOptions: newGapOptions,
        };
      });
    } else {
      setCurrentQuestion((prev) => ({ ...prev, [name]: value }));
    }
  }, [selectedQuestionType]);

  const handleGapOptionChange = useCallback((gapIndex, optionIndex, field, value) => {
    setCurrentQuestion((prev) => {
      const gapOptions = Array.isArray(prev.gapOptions) ? [...prev.gapOptions] : [];
      const gap = gapOptions[gapIndex] || { options: [] };
      const options = [...gap.options];
      const existing = options[optionIndex] || { text: '', is_correct: false, image_url: '' };

      let updatedOption;
      if (field === 'is_correct') {
        updatedOption = { ...existing, is_correct: value };
      } else {
        let nextValue = value;
        if (field === 'text' && typeof nextValue === 'string') {
          // For fill-in-the-gap options, do not allow underscore characters in the visible text
          nextValue = nextValue.replace(/_/g, '-');
        }
        updatedOption = { ...existing, [field]: nextValue };
      }

      options[optionIndex] = updatedOption;
      gapOptions[gapIndex] = { ...gap, options };
      return { ...prev, gapOptions };
    });
  }, []);

  const addGapOption = useCallback((gapIndex) => {
    setCurrentQuestion((prev) => {
      const gapOptions = Array.isArray(prev.gapOptions) ? [...prev.gapOptions] : [];
      const gap = gapOptions[gapIndex] || { options: [] };
      const options = [...gap.options, { text: '', is_correct: false, image_url: '' }];
      gapOptions[gapIndex] = { ...gap, options };
      return { ...prev, gapOptions };
    });
  }, []);

  const removeGapOption = useCallback((gapIndex, optionIndex) => {
    setCurrentQuestion((prev) => {
      const gapOptions = Array.isArray(prev.gapOptions) ? [...prev.gapOptions] : [];
      const gap = gapOptions[gapIndex] || { options: [] };
      const options = gap.options.filter((_, i) => i !== optionIndex);
      gapOptions[gapIndex] = { ...gap, options };
      return { ...prev, gapOptions };
    });
  }, []);

  const handleOptionChange = useCallback((index, field, value) => {
    setCurrentQuestion((prev) => {
      let newOptions = [...prev.options];
      if (field === 'is_correct') {
        // Toggle checkbox - multiple options can be correct
        newOptions[index] = { ...newOptions[index], is_correct: value };
      } else {
        newOptions[index] = { ...newOptions[index], [field]: value };
      }
      return { ...prev, options: newOptions };
    });
  }, []);

  const addOption = useCallback(() => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: [...prev.options, { text: '', is_correct: false, image_url: '' }],
    }));
  }, []);

  const removeOption = useCallback((index) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  }, []);

  const addQuestion = useCallback(() => {
    if (!currentQuestion.text.trim()) {
      setPopup({ message: 'Question text is not filled in', type: 'warning' });
      return;
    }

    // Basic multiple-choice question (existing behavior)
    if (selectedQuestionType === 'basic') {
      if (currentQuestion.options.length < 2) {
        setPopup({ message: 'Please add at least 2 options', type: 'warning' });
        return;
      }

      if (!currentQuestion.options.some((opt) => opt.is_correct)) {
        setPopup({ message: 'No correct answer is chosen', type: 'warning' });
        return;
      }

      if (currentQuestion.options.some((opt) => !opt.text.trim())) {
        setPopup({ message: 'An option text is not filled in', type: 'warning' });
        return;
      }

      const questionWithId = {
        ...currentQuestion,
        id: `q${formData.questions.length + 1}`,
        order: formData.questions.length,
        options: currentQuestion.options.map((opt, idx) => ({
          ...opt,
          index: idx,
        })),
      };

      setFormData((prev) => ({
        ...prev,
        questions: [...prev.questions, questionWithId],
      }));
    } else if (selectedQuestionType === 'fill_gap') {
      const textValue = currentQuestion.text;
      const gapMatches = textValue.match(/_{1,}/g) || [];
      const gapCount = gapMatches.length;

      if (gapCount === 0) {
        setPopup({ message: 'Fill-in-the-gap question must contain at least one _ (gap)', type: 'warning' });
        return;
      }

      const gapOptions = Array.isArray(currentQuestion.gapOptions) ? currentQuestion.gapOptions : [];
      if (gapOptions.length !== gapCount) {
        setPopup({ message: 'Please define options for every gap', type: 'warning' });
        return;
      }

      // Validate each gap: at least 2 options, at least 1 correct and 1 incorrect, all texts filled
      for (let g = 0; g < gapCount; g += 1) {
        const gap = gapOptions[g];
        const options = Array.isArray(gap?.options) ? gap.options : [];
        if (options.length < 2) {
          setPopup({ message: `Gap ${g + 1} must have at least 2 options`, type: 'warning' });
          return;
        }
        if (options.some((opt) => !opt.text.trim())) {
          setPopup({ message: `Gap ${g + 1} has an option without text`, type: 'warning' });
          return;
        }
        const correctCount = options.filter((opt) => opt.is_correct).length;
        const incorrectCount = options.length - correctCount;
        if (correctCount < 1 || incorrectCount < 1) {
          setPopup({ message: `Gap ${g + 1} needs at least 1 correct and 1 incorrect option`, type: 'warning' });
          return;
        }
      }

      // Encode per-gap options into the flat options array so the backend schema stays unchanged.
      // We prefix each option text with a hidden marker that includes the gap index.
      const flatOptions = [];
      let flatIndex = 0;
      for (let g = 0; g < gapCount; g += 1) {
        const gap = gapOptions[g];
        const options = Array.isArray(gap?.options) ? gap.options : [];
        options.forEach((opt) => {
          flatOptions.push({
            text: `__G${g}__${opt.text}`,
            is_correct: !!opt.is_correct,
            image_url: opt.image_url || '',
            index: flatIndex,
          });
          flatIndex += 1;
        });
      }

      const questionWithId = {
        ...currentQuestion,
        id: `q${formData.questions.length + 1}`,
        order: formData.questions.length,
        options: flatOptions,
      };

      setFormData((prev) => ({
        ...prev,
        questions: [...prev.questions, questionWithId],
      }));
    }

    setCurrentQuestion({
      text: '',
      image_url: '',
      explanation: '',
      options: [
        { text: '', is_correct: false, image_url: '' },
        { text: '', is_correct: false, image_url: '' },
      ],
      gapOptions: [],
    });

    // After adding any question, keep question type selector reset to Basic
    setQuestionTypeSelected(true);
    setSelectedQuestionType('basic');

    setError(null);
  }, [currentQuestion, formData.questions.length, selectedQuestionType, setPopup]);

  const removeQuestion = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, order: i, id: `q${i + 1}` })),
    }));
  }, []);

  const addTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  const removeTag = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  }, []);

  const handleMetadataSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setPopup({ message: 'No quiz name', type: 'warning' });
      return;
    }

    if (!formData.author.trim()) {
      setPopup({ message: 'No quiz author name', type: 'warning' });
      return;
    }

    setScreen('questions');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.questions.length === 0) {
      setError('Please add at least one question.');
      return;
    }

    try {
      setLoading(true);
      const quizData = {
        ...formData,
        tags: formData.tags.map((tag) => tag),
      };
      const newQuiz = await createQuiz(quizData);
      setPopup({ message: 'Quiz created successfully', type: 'success' });
      // Wait for popup to be visible before navigating
      setTimeout(() => {
        navigate(`/quiz/${newQuiz.id}`);
      }, 1500);
    } catch (err) {
      setPopup({ message: err.message || 'Failed to create quiz', type: 'warning' });
      console.error('Error creating quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderPreviewOptionText = (text) => {
    if (typeof text !== 'string') return text;
    const match = text.match(/^__G\d+__(.*)$/);
    if (match) {
      return match[1];
    }
    return text;
  };

  return (
    <div className="create-quiz">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />
      {screen === 'metadata' ? (
        // SCREEN 1: Quiz Metadata
        <div>
          <div className="screen-header">
            <h1 className="page-title">Create New Quiz</h1>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <form className="quiz-form">
            <section className="form-section">
              <h2 className="section-title">Quiz Details</h2>

              <div className="form-group">
                <label htmlFor="name">Quiz Name *</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleQuizChange}
                  placeholder="e.g., Python Basics Review"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="author">Author *</label>
                <input
                  id="author"
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleQuizChange}
                  placeholder="Your name"
                  disabled={loading}
                  required
                />
              </div>

              {/* Icon Selector */}
              <div className="form-group">
                <label htmlFor="icon">Quiz Icon</label>
                <div className="icon-selector">
                  {['📝', '🧮', '➕', '🔢', '🌍', '🪐', '🔬', '💻', '⚙️', '🎨', '🎭', '🎵', '📚', '🏆', '☕', '🚀', '💡', '🎯', '🧪', '🎮'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`icon-option ${formData.icon === emoji ? 'selected' : ''}`}
                      onClick={() => setFormData((prev) => ({ ...prev, icon: emoji }))}
                      disabled={loading}
                      aria-label={`Select ${emoji} icon`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Section */}
              <div className="form-group">
                <label>Tags</label>

                {/* Predefined Favorite Tags */}
                <div className="favorite-tags">
                  {['Math', 'Science', 'History', 'Fun', 'Technology'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`favorite-tag ${formData.tags.includes(tag) ? 'selected' : ''}`}
                      onClick={() => {
                        if (!formData.tags.includes(tag)) {
                          setFormData((prev) => ({
                            ...prev,
                            tags: [...prev.tags, tag],
                          }));
                        }
                      }}
                      disabled={loading || formData.tags.includes(tag)}
                      aria-label={`Add ${tag} tag`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="tag-input-group">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Or add a custom tag and press Enter"
                    disabled={loading}
                  />
                  <button type="button" onClick={addTag} disabled={loading} className="btn">
                    Add Tag
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="tags-list">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="pill">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          disabled={loading}
                          className="pill-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </form>

          {/* Bottom action buttons */}
          <div className="footer-actions row" style={{ justifyContent: 'space-between', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={loading}
              className="btn"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMetadataSubmit}
              disabled={loading}
              className="btn primary"
              aria-label="Continue to questions"
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        // SCREEN 2: Add Questions
        <div>
          <div className="screen-header">
            <h1 className="page-title">
              Add Questions <span className="question-counter">({formData.questions.length})</span>
            </h1>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="questions-container">
            {formData.questions.length > 0 && (
              <section className="form-section">
                <h2 className="section-title">Added Questions ({formData.questions.length})</h2>
                <div className="questions-list">
                  {formData.questions.map((question, qIndex) => (
                    <div key={qIndex} className="question-preview">
                      <div className="question-preview__header">
                        <p className="question-preview__text">{question.text}</p>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          disabled={loading}
                          className="btn-remove"
                          aria-label="Remove question"
                          title="Remove question"
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </div>
                      <div className="question-preview__options">
                        {(() => {
                          const options = Array.isArray(question.options) ? question.options : [];
                          const hasEncodedGaps = options.some((opt) => typeof opt.text === 'string' && /^__G\d+__/.test(opt.text));

                          if (!hasEncodedGaps) {
                            return options.map((option, oIndex) => (
                              <div key={oIndex} className="option-preview">
                                <span className={`option-check ${option.is_correct ? 'correct' : ''}`}>
                                  {option.is_correct ? '✓' : ''}
                                </span>
                                <span>{renderPreviewOptionText(option.text)}</span>
                              </div>
                            ));
                          }

                          const gapMap = new Map();
                          options.forEach((option) => {
                            if (typeof option.text !== 'string') {
                              return;
                            }
                            const match = option.text.match(/^__G(\d+)__(.*)$/);
                            if (!match) {
                              return;
                            }
                            const gapIndex = parseInt(match[1], 10);
                            if (!gapMap.has(gapIndex)) {
                              gapMap.set(gapIndex, []);
                            }
                            gapMap.get(gapIndex).push(option);
                          });

                          const gapIndices = Array.from(gapMap.keys()).sort((a, b) => a - b);

                          return gapIndices.map((gapIndex) => (
                            <div key={gapIndex} className="gap-options-group">
                              <span className="pill">Gap {gapIndex + 1}</span>
                              {gapMap.get(gapIndex).map((option, oIndex) => (
                                <div key={oIndex} className="option-preview">
                                  <span className={`option-check ${option.is_correct ? 'correct' : ''}`}>
                                    {option.is_correct ? '✓' : ''}
                                  </span>
                                  <span>{renderPreviewOptionText(option.text)}</span>
                                </div>
                              ))}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Question Editor */}
            <section className="form-section question-editor">
              <h2 className="section-title">
                Question {formData.questions.length + 1}
              </h2>

              {/* Question Type Selection - Small buttons on top */}
              <div className="question-type-selector-compact">
                <button
                  type="button"
                  className={`question-type-btn ${selectedQuestionType === 'basic' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedQuestionType('basic');
                    setQuestionTypeSelected(true);
                  }}
                  disabled={loading}
                >
                  Basic Question
                </button>
                <button
                  type="button"
                  className={`question-type-btn ${selectedQuestionType === 'fill_gap' ? 'active' : ''}`}
                  onClick={() => {
                    setQuestionTypeSelected(true);
                    setError(null);
                    setSelectedQuestionType('fill_gap');
                  }}
                  disabled={loading}
                >
                  Fill in the gap
                </button>
              </div>

              {questionTypeSelected && selectedQuestionType === 'basic' && (
                <>
                  <div className="form-group">
                    <label htmlFor="question-text">Question Text *</label>
                    <div className="question-input-row">
                      <textarea
                        id="question-text"
                        name="text"
                        value={currentQuestion.text}
                        onChange={handleQuestionChange}
                        placeholder="Enter the question"
                        disabled={loading}
                        rows="3"
                      />
                      <button
                        type="button"
                        className={`image-upload-square ${currentQuestion.image_url ? 'image-upload-square--has-image' : ''}`}
                        onClick={() => handleImageButtonClick({ type: 'question' })}
                        disabled={loading}
                        aria-label={currentQuestion.image_url ? 'Remove question image' : 'Add image to question'}
                      >
                        {currentQuestion.image_url ? (
                          <>
                            <img src={currentQuestion.image_url} alt="Question" className="image-upload-square__img" />
                            <span className="image-upload-square__remove">×</span>
                          </>
                        ) : (
                          <span className="image-upload-square__placeholder">Img</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Explanation Section */}
                  <div className="form-group">
                    <label htmlFor="question-explanation">Explanation (optional)</label>
                    <textarea
                      id="question-explanation"
                      name="explanation"
                      value={currentQuestion.explanation}
                      onChange={handleQuestionChange}
                      placeholder="Explain why this is the correct answer..."
                      disabled={loading}
                      rows="3"
                    />
                  </div>

                  {/* Options Section with Checkboxes for Multiple Correct Answers */}
                  <div className="form-group">
                    <label>Mark the correct answer(s) *</label>
                    <div className="options-editor">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="option-input-group">
                          <label className="custom-checkbox-wrapper">
                            <input
                              type="checkbox"
                              checked={option.is_correct}
                              onChange={(e) => handleOptionChange(index, 'is_correct', e.target.checked)}
                              disabled={loading}
                              className="custom-checkbox-input"
                            />
                            <span className="custom-checkbox"></span>
                            <input
                              type="text"
                              value={option.text}
                              onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              disabled={loading}
                              className="option-text-input"
                            />
                          </label>
                          <button
                            type="button"
                            className={`image-upload-square option-image-square ${option.image_url ? 'image-upload-square--has-image' : ''}`}
                            onClick={() => handleImageButtonClick({ type: 'option', index })}
                            disabled={loading}
                            aria-label={option.image_url ? `Remove image for option ${index + 1}` : `Add image to option ${index + 1}`}
                          >
                            {option.image_url ? (
                              <>
                                <img src={option.image_url} alt={`Option ${index + 1}`} className="image-upload-square__img" />
                                <span className="image-upload-square__remove">×</span>
                              </>
                            ) : (
                              <span className="image-upload-square__placeholder">Img</span>
                            )}
                          </button>
                          {currentQuestion.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              disabled={loading}
                              className="btn-remove"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="option-buttons">
                      <button
                        type="button"
                        onClick={addOption}
                        disabled={loading}
                        className="btn"
                      >
                        + Add Option
                      </button>

                      <button
                        type="button"
                        onClick={addQuestion}
                        disabled={loading}
                        className="btn primary"
                      >
                        ✓ Save Question
                      </button>
                    </div>
                  </div>
                </>
              )}

              {questionTypeSelected && selectedQuestionType === 'fill_gap' && (
                <>
                  <div className="form-group">
                    <label htmlFor="question-text-fill-gap">Question Text *</label>
                    <p className="muted" style={{ fontSize: '14px', marginBottom: '4px' }}>
                      Use one or more underscores (_) where you want gaps to appear. Each continuous run of underscores becomes a dropdown gap.
                    </p>
                    <div className="question-input-row">
                      <textarea
                        id="question-text-fill-gap"
                        name="text"
                        value={currentQuestion.text}
                        onChange={handleQuestionChange}
                        placeholder="e.g., Python was created by _ in the year _."
                        disabled={loading}
                        rows="3"
                      />
                      <button
                        type="button"
                        className={`image-upload-square ${currentQuestion.image_url ? 'image-upload-square--has-image' : ''}`}
                        onClick={() => handleImageButtonClick({ type: 'question' })}
                        disabled={loading}
                        aria-label={currentQuestion.image_url ? 'Remove question image' : 'Add image to question'}
                      >
                        {currentQuestion.image_url ? (
                          <>
                            <img src={currentQuestion.image_url} alt="Question" className="image-upload-square__img" />
                            <span className="image-upload-square__remove">×</span>
                          </>
                        ) : (
                          <span className="image-upload-square__placeholder">Img</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Explanation Section */}
                  <div className="form-group">
                    <label htmlFor="question-explanation-fill-gap">Explanation (optional)</label>
                    <textarea
                      id="question-explanation-fill-gap"
                      name="explanation"
                      value={currentQuestion.explanation}
                      onChange={handleQuestionChange}
                      placeholder="Explain why this is the correct answer..."
                      disabled={loading}
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Gap Options *</label>
                    <p className="muted" style={{ fontSize: '14px', marginBottom: '8px' }}>
                      For each gap, add at least one correct and one incorrect option.
                    </p>
                    {(() => {
                      const textValue = currentQuestion.text || '';
                      const gapMatches = textValue.match(/_{1,}/g) || [];
                      const gapCount = gapMatches.length;
                      const gapOptions = Array.isArray(currentQuestion.gapOptions) ? currentQuestion.gapOptions : [];

                      if (gapCount === 0) {
                        return (
                          <div className="muted" style={{ fontSize: '14px' }}>
                            Add at least one _ in the question text to create a gap.
                          </div>
                        );
                      }

                      return (
                        <div className="gap-options-editor">
                          {Array.from({ length: gapCount }).map((_, gapIndex) => {
                            const gap = gapOptions[gapIndex] || { options: [] };
                            const options = Array.isArray(gap.options) ? gap.options : [];
                            return (
                              <div key={gapIndex} className="gap-options-group">
                                <div className="gap-options-header">
                                  <span className="pill">Gap {gapIndex + 1}</span>
                                </div>
                                <div className="options-editor">
                                  {options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="option-input-group">
                                      <label className="custom-checkbox-wrapper">
                                        <input
                                          type="checkbox"
                                          checked={!!option.is_correct}
                                          onChange={(e) => handleGapOptionChange(gapIndex, optionIndex, 'is_correct', e.target.checked)}
                                          disabled={loading}
                                          className="custom-checkbox-input"
                                        />
                                        <span className="custom-checkbox"></span>
                                        <input
                                          type="text"
                                          value={option.text}
                                          onChange={(e) => handleGapOptionChange(gapIndex, optionIndex, 'text', e.target.value)}
                                          placeholder={`Option ${optionIndex + 1}`}
                                          disabled={loading}
                                          className="option-text-input"
                                        />
                                      </label>
                                      {options.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => removeGapOption(gapIndex, optionIndex)}
                                          disabled={loading}
                                          className="btn-remove"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => addGapOption(gapIndex)}
                                      disabled={loading}
                                      className="btn"
                                    >
                                      + Add Option to Gap {gapIndex + 1}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Explanation Section */}
                  <div className="form-group">
                    <label htmlFor="question-explanation-gap">Explanation (optional)</label>
                    <textarea
                      id="question-explanation-gap"
                      name="explanation"
                      value={currentQuestion.explanation}
                      onChange={handleQuestionChange}
                      placeholder="Explain why these are the correct answers..."
                      disabled={loading}
                      rows="3"
                    />
                  </div>

                  <div className="option-buttons">
                    <button
                      type="button"
                      onClick={addQuestion}
                      disabled={loading}
                      className="btn primary"
                    >
                      ✓ Save Question
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* Bottom action buttons */}
          <div className="footer-actions row" style={{ justifyContent: 'space-between', marginTop: '24px' }}>
            <div className="row" style={{ gap: '8px' }}>
              <button
                type="button"
                onClick={() => setScreen('metadata')}
                disabled={loading}
                className="btn"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={loading}
                className="btn"
              >
                Cancel
              </button>
            </div>
            {formData.questions.length > 0 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn primary success"
              >
                {loading ? 'Creating...' : '✓ Finish'}
              </button>
            )}
          </div>
        </div>
      )}

      {popup && (
        <div
          className={`popup ${popup.type === 'warning' ? 'popup--danger' : 'popup--success'} popup--top`}
          role="alert"
          aria-live="assertive"
        >
          {popup.message}
        </div>
      )}
    </div>
  );
}

export default CreateQuiz;