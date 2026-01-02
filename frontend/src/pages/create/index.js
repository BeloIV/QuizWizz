import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useQuizList } from '../../context/QuizContext';
import { API_BASE_URL } from '../../config';
import { useQuestionValidation } from '../../hooks/useQuestionValidation';
import { encodeGapOptions, decodeGapOptions } from '../../utils/gapEncoding';

import MetadataForm from './MetadataForm';
import QuestionEditor from './QuestionEditor';
import QuestionsList from './QuestionsList';
import PreviewScreen from './PreviewScreen';

/**
 * Main CreateQuiz component - orchestrates quiz creation/editing flow
 */
function CreateQuiz() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const { createQuiz, updateQuiz, getQuiz } = useQuizList();
  const isEditMode = !!quizId;

  const [screen, setScreen] = useState('metadata'); // 'metadata', 'questions', or 'preview'
  const [formData, setFormData] = useState({
    name: '',
    icon: '📝',
    tags: [],
    questions: [],
  });

  const questionsListRef = useRef(null);
  const questionsListFooterRef = useRef(null);
  const questionEditorRef = useRef(null);
  const skipAutoScrollRef = useRef(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  const [questionTypeSelected, setQuestionTypeSelected] = useState(true);
  const [selectedQuestionType, setSelectedQuestionType] = useState('basic');

  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    image_url: '',
    explanation: '',
    options: [
      { text: '', is_correct: false, image_url: '' },
      { text: '', is_correct: false, image_url: '' },
    ],
    gapOptions: [],
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [popup, setPopup] = useState(null);
  const popupTimeoutRef = useRef(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const fileInputRef = useRef(null);
  const [imageTarget, setImageTarget] = useState(null);

  const { hasUnsavedQuestion, validateQuestion, validateMetadata, syncGapOptionsWithText } = 
    useQuestionValidation(currentQuestion, selectedQuestionType);

  // Load quiz data if editing
  useEffect(() => {
    if (isEditMode && quizId) {
      const loadQuiz = async () => {
        try {
          setLoading(true);
          const quiz = await getQuiz(quizId);
          
          // Transform quiz data to form format
          setFormData({
            name: quiz.name || '',
            icon: quiz.icon || '📝',
            tags: quiz.tags || [],
            questions: quiz.questions.map((q, idx) => ({
              ...q,
              id: q.id || `q${idx + 1}`,
              order: idx,
            })) || [],
          });
        } catch (err) {
          setPopup({ message: err.message || 'Failed to load quiz', type: 'warning' });
          console.error('Error loading quiz:', err);
        } finally {
          setLoading(false);
        }
      };
      loadQuiz();
    }
  }, [isEditMode, quizId, getQuiz]);

  // Auto-dismiss popup
  useEffect(() => {
    if (popup) {
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = setTimeout(() => setPopup(null), 2000);
    }
    return () => {
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, [popup]);

  // Auto-scroll to top on screen/question changes
  useEffect(() => {
    if (skipAutoScrollRef.current) {
      skipAutoScrollRef.current = false;
      return;
    }
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      // noop
    }
  }, [screen, formData.questions.length]);

  const handleQuizChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const uploadImage = useCallback(async (file) => {
    const maxSize = 50 * 1024 * 1024;
    if (!file) throw new Error('No file selected');
    if (!file.type.startsWith('image/')) throw new Error('Selected file is not an image');
    if (file.size > maxSize) throw new Error('Image is too large (max 50MB)');

    const formData = new FormData();
    formData.append('file', file);

    // Get CSRF token from cookie
    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    const response = await fetch(`${API_BASE_URL}/upload-image/`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: csrfToken ? {
        'X-CSRFToken': csrfToken,
      } : {},
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Image upload failed (${response.status})`);
    }

    const data = await response.json();
    if (!data.url) throw new Error('Upload response did not contain image URL');
    return data.url;
  }, []);

  const handleImageFileChange = useCallback(async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file || !imageTarget) return;

    try {
      const url = await uploadImage(file);
      if (imageTarget.type === 'question') {
        setCurrentQuestion((prev) => ({ ...prev, image_url: url }));
      } else if (imageTarget.type === 'option' && typeof imageTarget.index === 'number') {
        setCurrentQuestion((prev) => {
          const options = [...prev.options];
          if (options[imageTarget.index]) {
            options[imageTarget.index] = { ...options[imageTarget.index], image_url: url };
          }
          return { ...prev, options };
        });
      }
    } catch (err) {
      setPopup({ message: err.message || 'Failed to upload image', type: 'warning' });
    } finally {
      setImageTarget(null);
    }
  }, [imageTarget, uploadImage]);

  const handleImageButtonClick = useCallback((target) => {
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
    if (fileInputRef.current) fileInputRef.current.click();
  }, [currentQuestion]);

  const handleQuestionChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'text' && selectedQuestionType === 'fill_gap') {
      setCurrentQuestion((prev) => ({
        ...prev,
        text: value,
        gapOptions: syncGapOptionsWithText(value, prev.gapOptions),
      }));
    } else {
      setCurrentQuestion((prev) => ({ ...prev, [name]: value }));
    }
  }, [selectedQuestionType, syncGapOptionsWithText]);

  const handleQuestionTypeChange = useCallback((type) => {
    setQuestionTypeSelected(true);
    setSelectedQuestionType(type);
    if (type === 'fill_gap') setError(null);
  }, []);

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
      let nextValue = value;
      if (field === 'text' && typeof nextValue === 'string') {
        nextValue = nextValue.replace(/_/g, '-');
      }
      const updatedOption = field === 'is_correct' 
        ? { ...existing, is_correct: value }
        : { ...existing, [field]: nextValue };
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
    const validation = validateQuestion();
    if (!validation.valid) {
      setPopup({ message: validation.error, type: 'warning' });
      return;
    }

    let questionWithId;

    if (selectedQuestionType === 'basic') {
      questionWithId = {
        ...currentQuestion,
        id: `q${formData.questions.length + 1}`,
        order: formData.questions.length,
        options: currentQuestion.options.map((opt, idx) => ({ ...opt, index: idx })),
      };
    } else if (selectedQuestionType === 'fill_gap') {
      const gapOptions = Array.isArray(currentQuestion.gapOptions) ? currentQuestion.gapOptions : [];
      const { options: flatOptions, explanations } = encodeGapOptions(gapOptions);
      questionWithId = {
        ...currentQuestion,
        id: editingQuestionIndex !== null ? formData.questions[editingQuestionIndex].id : `q${formData.questions.length + 1}`,
        order: editingQuestionIndex !== null ? editingQuestionIndex : formData.questions.length,
        options: flatOptions,
        explanation: explanations,
      };
    }

    if (editingQuestionIndex !== null) {
      setFormData((prev) => {
        const newQuestions = [...prev.questions];
        newQuestions[editingQuestionIndex] = questionWithId;
        return { ...prev, questions: newQuestions };
      });
      setEditingQuestionIndex(null);
    } else {
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

    setQuestionTypeSelected(true);
    setSelectedQuestionType('basic');
    setError(null);

    // Scroll to footer
    skipAutoScrollRef.current = true;
    setTimeout(() => {
      if (questionsListFooterRef.current) {
        const yOffset = -65;
        const element = questionsListFooterRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      setTimeout(() => {
        skipAutoScrollRef.current = false;
      }, 600);
    }, 100);
  }, [currentQuestion, formData.questions, selectedQuestionType, editingQuestionIndex, validateQuestion]);

  const removeQuestion = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, order: i, id: `q${i + 1}` })),
    }));
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

    if (hasUnsavedQuestion() && editingQuestionIndex !== index) {
      setConfirmDialog({
        message: 'You have unsaved changes in the current question. Do you want to discard them and edit another question?',
        onConfirm: () => {
          setConfirmDialog(null);
          loadQuestionForEditing(index, question);
        },
        onCancel: () => setConfirmDialog(null),
      });
    } else {
      loadQuestionForEditing(index, question);
    }
  }, [formData.questions, hasUnsavedQuestion, editingQuestionIndex]);

  const loadQuestionForEditing = useCallback((index, question) => {
    setEditingQuestionIndex(index);

    const hasEncodedGaps = question.options.some((opt) => typeof opt.text === 'string' && /^__G\d+__/.test(opt.text));

    if (hasEncodedGaps) {
      setSelectedQuestionType('fill_gap');
      const gapOptions = decodeGapOptions(question.options, question.explanation);
      setCurrentQuestion({
        text: question.text,
        image_url: question.image_url || '',
        explanation: '',
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

    const validation = validateMetadata(formData);
    if (!validation.valid) {
      setPopup({ message: validation.error, type: 'warning' });
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

    if (hasUnsavedQuestion()) {
      setConfirmDialog({
        message: 'You have unsaved changes in the current question. Do you want to proceed to preview without saving it?',
        onConfirm: () => {
          setConfirmDialog(null);
          setScreen('preview');
        },
        onCancel: () => setConfirmDialog(null),
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
      
      if (isEditMode) {
        // Update existing quiz
        const updatedQuiz = await updateQuiz(quizId, quizData);
        sessionStorage.setItem('quizSuccessMessage', 'Quiz updated successfully');
        navigate(`/quiz/${updatedQuiz.id}`);
      } else {
        // Create new quiz
        const newQuiz = await createQuiz(quizData);
        sessionStorage.setItem('quizSuccessMessage', 'Quiz created successfully');
        navigate(`/quiz/${newQuiz.id}`);
      }
    } catch (err) {
      setPopup({ message: err.message || `Failed to ${isEditMode ? 'update' : 'create'} quiz`, type: 'warning' });
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} quiz:`, err);
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
        onCancel: () => setConfirmDialog(null),
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
          navigate(isEditMode ? '/my-quizzes' : '/');
        },
        onCancel: () => setConfirmDialog(null),
      });
    } else {
      navigate(isEditMode ? '/my-quizzes' : '/');
    }
  };

  const handlePreviewEdit = (qIndex) => {
    setScreen('questions');
    setTimeout(() => editQuestion(qIndex), 100);
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

      {screen === 'metadata' && (
        <MetadataForm
          formData={formData}
          tagInput={tagInput}
          setTagInput={setTagInput}
          loading={loading}
          isEditMode={isEditMode}
          onQuizChange={handleQuizChange}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onSubmit={handleMetadataSubmit}
          onCancel={handleCancel}
        />
      )}

      {screen === 'questions' && (
        <div>
          <div className="screen-header">
            <h1 className="page-title">
              {isEditMode ? 'Edit Questions' : 'Add Questions'} <span className="question-counter">({formData.questions.length})</span>
            </h1>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="questions-container">
            {formData.questions.length > 0 && (
              <QuestionsList
                questions={formData.questions}
                editingQuestionIndex={editingQuestionIndex}
                loading={loading}
                questionsListRef={questionsListRef}
                questionsListFooterRef={questionsListFooterRef}
                onEditQuestion={editQuestion}
                onRemoveQuestion={removeQuestion}
              />
            )}

            <div ref={questionEditorRef}>
              <QuestionEditor
                currentQuestion={currentQuestion}
                selectedQuestionType={selectedQuestionType}
                questionTypeSelected={questionTypeSelected}
                editingQuestionIndex={editingQuestionIndex}
                formData={formData}
                loading={loading}
                fileInputRef={fileInputRef}
                onQuestionChange={handleQuestionChange}
                onQuestionTypeChange={handleQuestionTypeChange}
                onOptionChange={handleOptionChange}
                onAddOption={addOption}
                onRemoveOption={removeOption}
                onGapOptionChange={handleGapOptionChange}
                onGapExplanationChange={handleGapExplanationChange}
                onAddGapOption={addGapOption}
                onRemoveGapOption={removeGapOption}
                onImageButtonClick={handleImageButtonClick}
                onSaveQuestion={addQuestion}
              />
            </div>
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
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : '✓ Finish'}
              </button>
            )}
          </div>
        </div>
      )}

      {screen === 'preview' && (
        <PreviewScreen
          formData={formData}
          loading={loading}
          error={error}
          onBackToEdit={() => setScreen('questions')}
          onPublish={submitQuiz}
          onEditQuestion={handlePreviewEdit}
        />
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
