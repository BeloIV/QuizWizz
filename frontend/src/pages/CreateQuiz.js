import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQuizList } from '../context/QuizContext';
import { API_BASE_URL } from '../config';

function CreateQuiz() {
  const navigate = useNavigate();
  const { createQuiz } = useQuizList();

  const [screen, setScreen] = useState('metadata'); // 'metadata', 'questions', or 'preview'

  const [formData, setFormData] = useState({
    name: '',
    author: '',
    icon: '📝',
    tags: [],
    questions: [],
  });

  const questionsListRef = useRef(null);
  const questionsListFooterRef = useRef(null);
  const questionEditorRef = useRef(null);
  const skipAutoScrollRef = useRef(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

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
  const [confirmDialog, setConfirmDialog] = useState(null); // { message: string, onConfirm: function, onCancel: function }

  const fileInputRef = useRef(null);
  const [imageTarget, setImageTarget] = useState(null); // { type: 'question' | 'option', index?: number }

  // Helper function to check if current question has any unsaved content
  const hasUnsavedQuestion = useCallback(() => {
    // Check if question text is filled
    if (currentQuestion.text.trim()) {
      return true;
    }
    
    // Check if any option has text (for basic questions)
    if (selectedQuestionType === 'basic') {
      if (currentQuestion.options.some((opt) => opt.text.trim())) {
        return true;
      }
    }
    
    // Check if any gap option has text (for fill-in-the-gap questions)
    if (selectedQuestionType === 'fill_gap') {
      const gapOptions = Array.isArray(currentQuestion.gapOptions) ? currentQuestion.gapOptions : [];
      for (const gap of gapOptions) {
        const options = Array.isArray(gap?.options) ? gap.options : [];
        if (options.some((opt) => opt.text.trim())) {
          return true;
        }
      }
    }
    
    // Check if question has an image
    if (currentQuestion.image_url) {
      return true;
    }
    
    // Check if any option has an image
    if (currentQuestion.options.some((opt) => opt.image_url)) {
      return true;
    }
    
    // Check if explanation is filled
    if (currentQuestion.explanation?.trim()) {
      return true;
    }
    
    return false;
  }, [currentQuestion, selectedQuestionType]);

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

  const handleGapExplanationChange = useCallback((gapIndex, value) => {
    setCurrentQuestion((prev) => {
      const gapOptions = Array.isArray(prev.gapOptions) ? [...prev.gapOptions] : [];
      const gap = gapOptions[gapIndex] || { explanation: '', options: [] };
      gapOptions[gapIndex] = { ...gap, explanation: value };
      return { ...prev, gapOptions };
    });
  }, []);

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

      if (editingQuestionIndex !== null) {
        // Update existing question
        setFormData((prev) => {
          const newQuestions = [...prev.questions];
          newQuestions[editingQuestionIndex] = questionWithId;
          return { ...prev, questions: newQuestions };
        });
        setEditingQuestionIndex(null);
      } else {
        // Add new question
        setFormData((prev) => ({
          ...prev,
          questions: [...prev.questions, questionWithId],
        }));
      }
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
      // Also collect gap explanations into a JSON object
      const flatOptions = [];
      const gapExplanations = {};
      let flatIndex = 0;
      for (let g = 0; g < gapCount; g += 1) {
        const gap = gapOptions[g];
        const options = Array.isArray(gap?.options) ? gap.options : [];
        
        // Store explanation for this gap if it exists
        if (gap.explanation && gap.explanation.trim()) {
          gapExplanations[g] = gap.explanation.trim();
        }
        
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
        id: editingQuestionIndex !== null ? formData.questions[editingQuestionIndex].id : `q${formData.questions.length + 1}`,
        order: editingQuestionIndex !== null ? editingQuestionIndex : formData.questions.length,
        options: flatOptions,
        explanation: Object.keys(gapExplanations).length > 0 ? JSON.stringify(gapExplanations) : '',
      };

      if (editingQuestionIndex !== null) {
        // Update existing question
        setFormData((prev) => {
          const newQuestions = [...prev.questions];
          newQuestions[editingQuestionIndex] = questionWithId;
          return { ...prev, questions: newQuestions };
        });
        setEditingQuestionIndex(null);
      } else {
        // Add new question
        setFormData((prev) => ({
          ...prev,
          questions: [...prev.questions, questionWithId],
        }));
      }
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
    
    // When adding/updating we already scroll to the saved-questions footer.
    // Mark that the next automatic top-scroll should be skipped so it doesn't override this footer scroll.
    skipAutoScrollRef.current = true;
    setTimeout(() => {
      if (questionsListFooterRef.current) {
        const yOffset = -65; // Small offset from top
        const element = questionsListFooterRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      // Clear the skip flag shortly after the footer scroll completes
      setTimeout(() => {
        skipAutoScrollRef.current = false;
      }, 600);
    }, 100);
  }, [currentQuestion, formData.questions, selectedQuestionType, setPopup, editingQuestionIndex]);

  // Auto-scroll to top whenever screen changes or number of questions changes,
  // except when a deliberate footer scroll just happened (skipAutoScrollRef).
  useEffect(() => {
    if (skipAutoScrollRef.current) {
      // consume the flag but do not perform the top scroll
      skipAutoScrollRef.current = false;
      return;
    }

    // Smoothly scroll to top for creation flow changes
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      // noop in non-browser environments
    }
  // watch screen and questions count so creation actions trigger a top scroll
  }, [screen, formData.questions.length]);

  const removeQuestion = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, order: i, id: `q${i + 1}` })),
    }));
    // If we're editing the question being removed, cancel editing
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
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
    }
  }, [editingQuestionIndex]);

  const editQuestion = useCallback((index) => {
    const question = formData.questions[index];
    if (!question) return;

    // Check if there are unsaved changes before loading another question
    if (hasUnsavedQuestion() && editingQuestionIndex !== index) {
      setConfirmDialog({
        message: 'You have unsaved changes in the current question. Do you want to discard them and edit another question?',
        onConfirm: () => {
          setConfirmDialog(null);
          loadQuestionForEditing(index, question);
        },
        onCancel: () => {
          setConfirmDialog(null);
        },
      });
    } else {
      loadQuestionForEditing(index, question);
    }
  }, [formData.questions, hasUnsavedQuestion, editingQuestionIndex]);

  const loadQuestionForEditing = useCallback((index, question) => {
    setEditingQuestionIndex(index);

    // Check if this is a fill-in-the-gap question
    const hasEncodedGaps = question.options.some((opt) => typeof opt.text === 'string' && /^__G\d+__/.test(opt.text));

    if (hasEncodedGaps) {
      setSelectedQuestionType('fill_gap');
      
      // Decode gap options
      const gapMap = new Map();
      question.options.forEach((option) => {
        if (typeof option.text !== 'string') return;
        const match = option.text.match(/^__G(\d+)__(.*)$/);
        if (!match) return;
        const gapIndex = parseInt(match[1], 10);
        if (!gapMap.has(gapIndex)) {
          gapMap.set(gapIndex, []);
        }
        gapMap.get(gapIndex).push({
          text: match[2],
          is_correct: option.is_correct,
          image_url: option.image_url || '',
        });
      });

      const gapOptions = [];
      const gapIndices = Array.from(gapMap.keys()).sort((a, b) => a - b);
      
      // Parse gap explanations if they exist
      let gapExplanations = {};
      if (question.explanation) {
        try {
          gapExplanations = JSON.parse(question.explanation);
        } catch (e) {
          // Not JSON, treat as single explanation
        }
      }

      gapIndices.forEach((gapIndex) => {
        gapOptions.push({
          options: gapMap.get(gapIndex),
          explanation: gapExplanations[gapIndex] || '',
        });
      });

      setCurrentQuestion({
        text: question.text,
        image_url: question.image_url || '',
        explanation: '', // Explanation is stored per-gap for fill-gap questions
        options: [
          { text: '', is_correct: false, image_url: '' },
          { text: '', is_correct: false, image_url: '' },
        ],
        gapOptions,
      });
    } else {
      setSelectedQuestionType('basic');
      setCurrentQuestion({
        text: question.text,
        image_url: question.image_url || '',
        explanation: question.explanation || '',
        options: question.options.map((opt) => ({
          text: opt.text,
          is_correct: opt.is_correct,
          image_url: opt.image_url || '',
        })),
        gapOptions: [],
      });
    }

    setQuestionTypeSelected(true);
    
    // Scroll to editor
    setTimeout(() => {
      if (questionEditorRef.current) {
        questionEditorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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

    // Check for unsaved question before proceeding to preview
    if (hasUnsavedQuestion()) {
      setConfirmDialog({
        message: 'You have unsaved changes in the current question. Do you want to proceed to preview without saving it?',
        onConfirm: () => {
          setConfirmDialog(null);
          setScreen('preview');
        },
        onCancel: () => {
          setConfirmDialog(null);
        },
      });
      return;
    }

    setScreen('preview');
  };

  const submitQuiz = async () => {
    try {
      setLoading(true);
      const quizData = {
        ...formData,
        tags: formData.tags.map((tag) => tag),
      };
      const newQuiz = await createQuiz(quizData);
      // Store success message in sessionStorage to show on next page
      sessionStorage.setItem('quizSuccessMessage', 'Quiz created successfully');
      // Navigate immediately
      navigate(`/quiz/${newQuiz.id}`);
    } catch (err) {
      setPopup({ message: err.message || 'Failed to create quiz', type: 'warning' });
      console.error('Error creating quiz:', err);
      setLoading(false);
    }
  };

  const handleBackToMetadata = () => {
    if (hasUnsavedQuestion()) {
      setConfirmDialog({
        message: 'You have unsaved changes in the current question. Do you want to go back without saving it?',
        onConfirm: () => {
          setConfirmDialog(null);
          setScreen('metadata');
        },
        onCancel: () => {
          setConfirmDialog(null);
        },
      });
    } else {
      setScreen('metadata');
    }
  };

  const handleCancel = () => {
    if (hasUnsavedQuestion()) {
      setConfirmDialog({
        message: 'You have unsaved changes in the current question. Do you want to cancel without saving it?',
        onConfirm: () => {
          setConfirmDialog(null);
          navigate('/');
        },
        onCancel: () => {
          setConfirmDialog(null);
        },
      });
    } else {
      navigate('/');
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
              onClick={handleCancel}
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
      ) : screen === 'questions' ? (
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
              <section className="form-section" ref={questionsListRef}>
                <div className="questions-list-header">
                  <h2 className="section-title">Added Questions ({formData.questions.length})</h2>
                </div>
                <div className="questions-list">
                  {formData.questions.map((question, qIndex) => (
                    <div key={qIndex} className={`question-preview ${editingQuestionIndex === qIndex ? 'editing' : ''}`}>
                      <div className="question-preview__header">
                        <p className="question-preview__text">{question.text}</p>
                        <div className="question-preview__actions">
                          <button
                            type="button"
                            onClick={() => editQuestion(qIndex)}
                            disabled={loading}
                            className="btn-edit"
                            aria-label="Edit question"
                            title="Edit question"
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
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
                <div className="questions-list-footer" ref={questionsListFooterRef}>
                  <p className="muted" style={{ fontSize: '14px', textAlign: 'center', marginTop: '16px' }}>
                     ↑ Edit existing ones <br /> ↓ Add more questions below 
                  </p>
                </div>
              </section>
            )}

            {/* Question Editor */
            <section className="form-section question-editor" ref={questionEditorRef}>
              <h2 className="section-title">
                {editingQuestionIndex !== null ? `Editing Question ${editingQuestionIndex + 1}` : `Question ${formData.questions.length + 1}`}
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
                                
                                <div style={{ marginTop: '12px' }}>
                                  <label htmlFor={`gap-explanation-${gapIndex}`} style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
                                    Explanation for Gap {gapIndex + 1} (optional)
                                  </label>
                                  <textarea
                                    id={`gap-explanation-${gapIndex}`}
                                    value={gap.explanation || ''}
                                    onChange={(e) => handleGapExplanationChange(gapIndex, e.target.value)}
                                    placeholder="Explain why this is the correct answer..."
                                    disabled={loading}
                                    rows="2"
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      background: 'rgba(13, 23, 48, 0.6)',
                                      border: '1px solid rgba(118, 139, 180, 0.35)',
                                      borderRadius: '8px',
                                      color: 'var(--text)',
                                      fontFamily: 'inherit',
                                      fontSize: '13px',
                                      resize: 'vertical'
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
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
            </section>}
          </div>

          <div className="footer-actions row" style={{ justifyContent: 'space-between', marginTop: '24px' }}>
            <div className="row" style={{ gap: '8px' }}>
              <button
                type="button"
                onClick={handleBackToMetadata}
                disabled={loading}
                className="btn"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleCancel}
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
      ) : screen === 'preview' ? (
        // SCREEN 3: Preview and Confirm
        <div>
          <div className="screen-header">
            <h1 className="page-title">Review Your Quiz</h1>
            <p className="muted" style={{ fontSize: '15px', marginTop: '8px' }}>
              Review the quiz details before publishing
            </p>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="preview-container">
            {/* Quiz Metadata */}
            <section className="form-section">
              <h2 className="section-title">Quiz Details</h2>
              <div className="preview-details">
                <div className="preview-row">
                  <span className="preview-label">Name:</span>
                  <span className="preview-value">{formData.name}</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Author:</span>
                  <span className="preview-value">{formData.author}</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Icon:</span>
                  <span className="preview-value" style={{ fontSize: '24px' }}>{formData.icon}</span>
                </div>
                {formData.tags.length > 0 && (
                  <div className="preview-row">
                    <span className="preview-label">Tags:</span>
                    <div className="tags-list">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Questions Preview */}
            <section className="form-section">
              <h2 className="section-title">Questions ({formData.questions.length})</h2>
              <div className="preview-questions-list">
                {formData.questions.map((question, qIndex) => (
                  <div key={qIndex} className="preview-question-card">
                    <div className="preview-question-header">
                      <span className="preview-question-number">Question {qIndex + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setScreen('questions');
                          setTimeout(() => editQuestion(qIndex), 100);
                        }}
                        disabled={loading}
                        className="btn-edit-small"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="preview-question-text">{question.text}</p>
                    {question.image_url && (
                      <img src={question.image_url} alt="Question" className="preview-question-image" />
                    )}
                    <div className="preview-options">
                      {(() => {
                        const options = Array.isArray(question.options) ? question.options : [];
                        const hasEncodedGaps = options.some((opt) => typeof opt.text === 'string' && /^__G\d+__/.test(opt.text));

                        if (!hasEncodedGaps) {
                          return options.map((option, oIndex) => (
                            <div key={oIndex} className={`preview-option ${option.is_correct ? 'correct' : ''}`}>
                              <span className="option-check">
                                {option.is_correct ? '✓' : '○'}
                              </span>
                              <span className="option-text">{renderPreviewOptionText(option.text)}</span>
                              {option.image_url && (
                                <img src={option.image_url} alt={`Option ${oIndex + 1}`} className="preview-option-image" />
                              )}
                            </div>
                          ));
                        }

                        const gapMap = new Map();
                        options.forEach((option) => {
                          if (typeof option.text !== 'string') return;
                          const match = option.text.match(/^__G(\d+)__(.*)$/);
                          if (!match) return;
                          const gapIndex = parseInt(match[1], 10);
                          if (!gapMap.has(gapIndex)) {
                            gapMap.set(gapIndex, []);
                          }
                          gapMap.get(gapIndex).push(option);
                        });

                        const gapIndices = Array.from(gapMap.keys()).sort((a, b) => a - b);

                        return gapIndices.map((gapIndex) => (
                          <div key={gapIndex} className="preview-gap-group">
                            <span className="pill">Gap {gapIndex + 1}</span>
                            {gapMap.get(gapIndex).map((option, oIndex) => (
                              <div key={oIndex} className={`preview-option ${option.is_correct ? 'correct' : ''}`}>
                                <span className="option-check">
                                  {option.is_correct ? '✓' : '○'}
                                </span>
                                <span className="option-text">{renderPreviewOptionText(option.text)}</span>
                              </div>
                            ))}
                          </div>
                        ));
                      })()}
                    </div>
                    {question.explanation && (
                      <div className="preview-explanation">
                        <strong>Explanation:</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Bottom action buttons */}
          <div className="footer-actions row" style={{ justifyContent: 'space-between', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => setScreen('questions')}
              disabled={loading}
              className="btn"
            >
              ← Back to Edit
            </button>
            <button
              type="button"
              onClick={submitQuiz}
              disabled={loading}
              className="btn primary success"
            >
              {loading ? 'Creating...' : '✓ Publish Quiz'}
            </button>
          </div>
        </div>
      ) : null}

      {popup && (
        <div
          className={`popup ${popup.type === 'warning' ? 'popup--danger' : 'popup--success'} popup--top`}
          role="alert"
          aria-live="assertive"
        >
          {popup.message}
        </div>
      )}

      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Unsaved Changes</h3>
            <p className="modal-message">{confirmDialog.message}</p>
            <div className="modal-actions">
              <button
                type="button"
                onClick={confirmDialog.onCancel}
                className="btn"
              >
                No, Stay
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="btn primary"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateQuiz;
