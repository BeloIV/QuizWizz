import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQuizList } from '../context/QuizContext';

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
  const [selectedQuestionType, setSelectedQuestionType] = useState('basic'); // 'basic' or 'other'

  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    options: [
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ],
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [popup, setPopup] = useState(null); // { message: string, type: 'warning' | 'success' }
  const popupTimeoutRef = useRef(null);

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

  const handleQuestionChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentQuestion((prev) => ({ ...prev, [name]: value }));
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
      options: [...prev.options, { text: '', is_correct: false }],
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

    setCurrentQuestion({
      text: '',
      options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ],
    });

    // Keep question type selected as Basic
    setQuestionTypeSelected(true);
    setSelectedQuestionType('basic');

    setError(null);
  }, [currentQuestion, formData.questions.length]);

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

  // Helper to determine if the current question editor has valid inputs
  const canAddQuestion = (
    currentQuestion &&
    currentQuestion.text &&
    currentQuestion.text.trim() &&
    Array.isArray(currentQuestion.options) &&
    currentQuestion.options.length >= 2 &&
    currentQuestion.options.every((opt) => opt.text && opt.text.trim()) &&
    currentQuestion.options.some((opt) => opt.is_correct)
  );

  return (
      <div className="create-quiz">
        {screen === 'metadata' ? (
            // SCREEN 1: Quiz Metadata
            <div>
              <div className="screen-header">
                <h1 className="page-title">Create New Quiz</h1>
                <div className="right-actions">
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
                          placeholder="Add a tag and press Enter"
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

                {/* Cancel moved to floating top-left actions */}
              </form>
            </div>
        ) : (
            // SCREEN 2: Add Questions
            <div>
              <div className="screen-header">
                <h1 className="page-title">
                  Add Questions <span className="question-counter">({formData.questions.length})</span>
                </h1>
                <div className="right-actions">
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

              {error && <div className="error-banner">{error}</div>}

              <div className="questions-container">
                {formData.questions.length > 0 && (
                    <section className="form-section">
                      <h2 className="section-title">Added Questions ({formData.questions.length})</h2>
                      <div className="questions-list">
                        {formData.questions.map((question, qIndex) => (
                            <div key={qIndex} className="question-preview">
                              <div className="question-preview__header">
                                <button
                                    type="button"
                                    onClick={() => removeQuestion(qIndex)}
                                    disabled={loading}
                                    className="btn danger"
                                >
                                  Remove
                                </button>
                              </div>
                              <p className="question-preview__text">{question.text}</p>
                              <div className="question-preview__options">
                                {question.options.map((option, oIndex) => (
                                    <div key={oIndex} className="option-preview">
                              <span className={`option-check ${option.is_correct ? 'correct' : ''}`}>
                                {option.is_correct ? '✓' : ''}
                              </span>
                                      <span>{option.text}</span>
                                    </div>
                                ))}
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
                          className={`question-type-btn ${selectedQuestionType === 'other' ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedQuestionType('other');
                            setError('This question type is not yet available');
                          }}
                          disabled={loading}
                        >
                          Other
                        </button>
                      </div>

                      {questionTypeSelected && selectedQuestionType === 'basic' && (
                        <>
                      <div className="form-group">
                        <label htmlFor="question-text">Question Text *</label>
                        <textarea
                            id="question-text"
                            name="text"
                            value={currentQuestion.text}
                            onChange={handleQuestionChange}
                            placeholder="Enter the question"
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
                            + Add Question
                          </button>
                        </div>
                      </div>

                      {/* in-page Add Question removed — use top + Add Question */}
                        </>
                      )}
                </section>

                
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