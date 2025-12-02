import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { API_BASE_URL } from '../config';
import { useQuizList } from '../context/QuizContext';

function CreateQuiz() {
  const navigate = useNavigate();
  const { createQuiz } = useQuizList();

  const [screen, setScreen] = useState('metadata'); // 'metadata' or 'questions'

  const [formData, setFormData] = useState({
    name: '',
    author: '',
    description: '',
    tags: [],
    questions: [],
  });

  // Changed to string
  const [questionCount, setQuestionCount] = useState('25');

  // Question type selection state - Basic is selected by default
  const [questionTypeSelected, setQuestionTypeSelected] = useState(true);
  const [selectedQuestionType, setSelectedQuestionType] = useState('MULTIPLE_CHOICE'); // 'MULTIPLE_CHOICE', 'FILL_IN_THE_GAP', 'IMAGE'

  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    question_type: 'MULTIPLE_CHOICE',
    options: [
      { text: '', image: '', is_correct: false },
      { text: '', image: '', is_correct: false },
    ],
    image: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const handleQuizChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleQuestionChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentQuestion((prev) => ({ ...prev, [name]: value }));
  }, []);

  const uploadImage = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/images/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    if (!data.url) {
      throw new Error('Invalid upload response');
    }
    return data.url;
  }, []);

  const handleQuestionImageFileChange = useCallback(async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const url = await uploadImage(file);
      setCurrentQuestion((prev) => ({ ...prev, image: url }));
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  }, [uploadImage]);

  const handleOptionImageFileChange = useCallback(async (index, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const url = await uploadImage(file);
      setCurrentQuestion((prev) => {
        const options = [...prev.options];
        options[index] = { ...options[index], image: url };
        return { ...prev, options };
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  }, [uploadImage]);

  const handleQuestionTypeChange = useCallback((type) => {
    setSelectedQuestionType(type);
    setCurrentQuestion(prev => ({
      ...prev,
      question_type: type,
      options: type === 'FILL_IN_THE_GAP' 
        ? [
            { text: '', is_correct: true },
            { text: '', is_correct: false },
            { text: '', is_correct: false }
          ]
        : [
            { text: '', image: '', is_correct: false },
            { text: '', image: '', is_correct: false },
          ]
    }));
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
      options: [...prev.options, { text: '', image: '', is_correct: false }],
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
      setError('Please enter a question');
      return;
    }

    if (currentQuestion.question_type === 'MULTIPLE_CHOICE' || currentQuestion.question_type === 'IMAGE') {
      if (currentQuestion.options.length < 2) {
        setError('Please add at least 2 options');
        return;
      }

      if (!currentQuestion.options.some((opt) => opt.is_correct)) {
        setError('Please mark at least one option as correct');
        return;
      }

      if (currentQuestion.options.some((opt) => !opt.text.trim())) {
        setError('Please provide text for all options');
        return;
      }
    } else if (currentQuestion.question_type === 'FILL_IN_THE_GAP') {
      if (currentQuestion.options.length === 0 || !currentQuestion.options[0].text.trim()) {
        setError('Please enter the correct answer for the gap');
        return;
      }
      // Ensure at least one incorrect answer is provided
      const incorrectAnswers = currentQuestion.options
        .filter((opt, idx) => idx > 0 && opt.text.trim())
        .length;
      if (incorrectAnswers < 1) {
        setError('Please add at least one incorrect answer');
        return;
      }
    }

    const questionWithId = {
      ...currentQuestion,
      id: `q${formData.questions.length + 1}`,
      order: formData.questions.length,
      question_type: selectedQuestionType,
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
      question_type: 'MULTIPLE_CHOICE',
      options: [
        { text: '', image: '', is_correct: false },
        { text: '', image: '', is_correct: false },
      ],
      image: '',
    });

    // Reset question type to default
    setQuestionTypeSelected(true);
    setSelectedQuestionType('MULTIPLE_CHOICE');

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
      setError('Please enter a quiz name');
      return;
    }

    if (!formData.author.trim()) {
      setError('Please enter an author name');
      return;
    }

    // Updated validation
    if (!questionCount || isNaN(parseInt(questionCount)) || parseInt(questionCount) < 1) {
      setError('Please enter at least 1 question');
      return;
    }

    setScreen('questions');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Compare using parseInt
    if (formData.questions.length !== parseInt(questionCount)) {
      setError(`Please add exactly ${questionCount} questions. You have ${formData.questions.length}.`);
      return;
    }

    try {
      setLoading(true);
      const quizData = {
        ...formData,
        tags: formData.tags.map((tag) => tag),
      };
      const newQuiz = await createQuiz(quizData);
      navigate(`/quiz/${newQuiz.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create quiz');
      console.error('Error creating quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="create-quiz">
        {screen === 'metadata' ? (
            // SCREEN 1: Quiz Metadata
            <div>
              <div className="screen-header">
                <h1 className="page-title">Create New Quiz</h1>
                <button
                    type="button"
                    onClick={handleMetadataSubmit}
                    disabled={loading || !formData.name.trim() || !formData.author.trim()}
                    className="btn primary"
                    aria-label="Continue to questions"
                >
                  Continue
                </button>
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

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleQuizChange}
                        placeholder="Optional: describe what this quiz covers"
                        disabled={loading}
                        rows="3"
                    />
                  </div>

                  {/* Question Count */}
                  <div className="form-group">
                    <label htmlFor="questionCount">Number of Questions *</label>
                    <input
                        id="questionCount"
                        type="number"
                        value={questionCount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^[0-9\b]+$/.test(value)) {
                            setQuestionCount(value);
                          }
                        }}
                        placeholder="e.g., 25"
                        disabled={loading}
                        min="1"
                        max="100"
                        required
                    />
                    <p className="form-hint">How many questions do you want to create?</p>
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

                <section className="form-section">
                  <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        disabled={loading}
                        className="btn"
                    >
                      Cancel
                    </button>
                  </div>
                </section>
              </form>
            </div>
        ) : (
            // SCREEN 2: Add Questions
            <div>
              <div className="screen-header">
                <h1 className="page-title">
                  Add Questions <span className="question-counter">({formData.questions.length}/{parseInt(questionCount)})</span>
                </h1>
                {formData.questions.length === parseInt(questionCount) && (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn primary success"
                    >
                      {loading ? 'Creating...' : '✓ Continue'}
                    </button>
                )}
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
                                <h4 className="question-preview__number">Question {qIndex + 1}</h4>
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
                {formData.questions.length < parseInt(questionCount) && (
                    <section className="form-section question-editor">
                      <h2 className="section-title">
                        Add Question {formData.questions.length + 1}
                      </h2>

                      {/* Question Type Selection - Small buttons on top */}
                      <div className="question-type-selector-compact">
                        <button
                          type="button"
                          className={`question-type-btn ${selectedQuestionType === 'MULTIPLE_CHOICE' ? 'active' : ''}`}
                          onClick={() => handleQuestionTypeChange('MULTIPLE_CHOICE')}
                          disabled={loading}
                        >
                          Multiple Choice
                        </button>
                        <button
                          type="button"
                          className={`question-type-btn ${selectedQuestionType === 'FILL_IN_THE_GAP' ? 'active' : ''}`}
                          onClick={() => handleQuestionTypeChange('FILL_IN_THE_GAP')}
                          disabled={loading}
                        >
                          Fill in the Gap
                        </button>
                        <button
                          type="button"
                          className={`question-type-btn ${selectedQuestionType === 'IMAGE' ? 'active' : ''}`}
                          onClick={() => handleQuestionTypeChange('IMAGE')}
                          disabled={loading}
                        >
                          Image-based
                        </button>
                      </div>

                      {questionTypeSelected && (
                        <>
                      <div className="form-group">
                        <label htmlFor="question-text">
                          {selectedQuestionType === 'FILL_IN_THE_GAP' 
                            ? 'Enter the sentence with _____ for the gap(s) *' 
                            : 'Question Text'}
                        </label>
                        <textarea
                            id="question-text"
                            name="text"
                            value={currentQuestion.text}
                            onChange={handleQuestionChange}
                            placeholder={
                              selectedQuestionType === 'FILL_IN_THE_GAP'
                                ? 'E.g., The capital of France is _____. Use _____ for multiple gaps.'
                                : 'Enter the question'
                            }
                            disabled={loading}
                            required
                            rows={selectedQuestionType === 'FILL_IN_THE_GAP' ? 2 : 3}
                        />
                        {selectedQuestionType === 'IMAGE' && (
                          <div style={{ marginTop: '8px' }}>
                            <label htmlFor="question-image-file" style={{ display: 'block', marginBottom: '4px' }}>
                              Question image
                            </label>
                            <div>
                              <label className="btn" style={{ cursor: loading || imageUploading ? 'not-allowed' : 'pointer' }}>
                                {imageUploading ? 'Uploading...' : (currentQuestion.image ? 'Change image' : 'Choose image')}
                                <input
                                  id="question-image-file"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleQuestionImageFileChange}
                                  disabled={loading || imageUploading}
                                  style={{ display: 'none' }}
                                />
                              </label>
                              {currentQuestion.image && (
                                <span className="muted" style={{ marginLeft: '8px', fontSize: '0.85em' }}>
                                  Image selected
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedQuestionType === 'MULTIPLE_CHOICE' || selectedQuestionType === 'IMAGE' ? (
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
                                  {selectedQuestionType === 'IMAGE' && (
                                    <span style={{ marginLeft: '8px' }}>
                                      <label className="btn" style={{ padding: '6px 10px', fontSize: '0.85em', cursor: loading || imageUploading ? 'not-allowed' : 'pointer' }}>
                                        {imageUploading ? 'Uploading...' : (option.image ? 'Change image' : 'Choose image')}
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleOptionImageFileChange(index, e)}
                                          disabled={loading || imageUploading}
                                          style={{ display: 'none' }}
                                        />
                                      </label>
                                      {option.image && (
                                        <span className="muted" style={{ marginLeft: '4px', fontSize: '0.8em' }}>
                                          Image
                                        </span>
                                      )}
                                    </span>
                                  )}
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

                          <button
                            type="button"
                            onClick={addOption}
                            disabled={loading}
                            className="btn"
                          >
                            + Add Option
                          </button>
                        </div>
                      ) : (
                        <div className="form-group">
                          <label>Correct Answer *</label>
                          <div className="options-editor">
                            <div className="option-input-group">
                              <input
                                type="text"
                                value={currentQuestion.options[0]?.text || ''}
                                onChange={(e) => handleOptionChange(0, 'text', e.target.value)}
                                placeholder="Enter the correct answer"
                                disabled={loading}
                                className="option-text-input"
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>
                          <p className="form-hint" style={{ marginBottom: '16px' }}>
                            Users will need to type this exact answer to get it right. 
                            For multiple possible correct answers, separate them with semicolons (e.g., "color; colour").
                          </p>
                          
                          <label>Incorrect Answers *</label>
                          <div className="options-editor">
                            {currentQuestion.options.slice(1).map((option, index) => (
                              <div key={index + 1} className="option-input-group" style={{ marginBottom: '8px' }}>
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => handleOptionChange(index + 1, 'text', e.target.value)}
                                  placeholder={`Incorrect answer ${index + 1}`}
                                  disabled={loading}
                                  className="option-text-input"
                                  style={{ width: 'calc(100% - 40px)' }}
                                />
                                {currentQuestion.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(index + 1)}
                                    disabled={loading}
                                    className="btn-remove"
                                    style={{ marginLeft: '8px' }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <button
                            type="button"
                            onClick={addOption}
                            disabled={loading || currentQuestion.options.length >= 6}
                            className="btn"
                            style={{ marginTop: '8px' }}
                          >
                            + Add Incorrect Answer
                          </button>
                        </div>
                      )}

                      <button
                          type="button"
                          onClick={addQuestion}
                          disabled={loading}
                          className="btn primary"
                      >
                        Add Question
                      </button>
                        </>
                      )}
                    </section>
                )}

                {/* Back Button */}
                <section className="form-section">
                  <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => setScreen('metadata')}
                        disabled={loading}
                        className="btn"
                    >
                      ← Back
                    </button>
                  </div>
                </section>
              </div>
            </div>
        )}
      </div>
  );
}

export default CreateQuiz;