import { useCallback } from 'react';
import { LuImagePlus } from "react-icons/lu";
import { IoIosSave } from "react-icons/io";

/**
 * Component for editing a single question (basic or fill-gap)
 */
function QuestionEditor({
  currentQuestion,
  selectedQuestionType,
  questionTypeSelected,
  editingQuestionIndex,
  formData,
  loading,
  fileInputRef,
  onQuestionChange,
  onQuestionTypeChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onGapOptionChange,
  onGapExplanationChange,
  onImageButtonClick,
  onSaveQuestion,
}) {
  const handleQuestionTypeClick = useCallback((type) => {
    onQuestionTypeChange(type);
  }, [onQuestionTypeChange]);

  return (
    <section className="form-section question-editor">
      <h2 className="section-title">
        {editingQuestionIndex !== null 
          ? `Editing Question ${editingQuestionIndex + 1}` 
          : `Question ${formData.questions.length + 1}`}
      </h2>

      {/* Question Type Selection */}
      <div className="question-type-selector-compact">
        <button
          type="button"
          className={`question-type-btn ${selectedQuestionType === 'basic' ? 'active' : ''}`}
          onClick={() => handleQuestionTypeClick('basic')}
          disabled={loading}
        >
          Basic Question
        </button>
        <button
          type="button"
          className={`question-type-btn ${selectedQuestionType === 'fill_gap' ? 'active' : ''}`}
          onClick={() => handleQuestionTypeClick('fill_gap')}
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
                onChange={onQuestionChange}
                placeholder="Enter the question"
                disabled={loading}
                rows="3"
              />
              <button
                type="button"
                className={`image-upload-square ${currentQuestion.image_url ? 'image-upload-square--has-image' : ''}`}
                onClick={() => onImageButtonClick({ type: 'question' })}
                disabled={loading}
                aria-label={currentQuestion.image_url ? 'Remove question image' : 'Add image to question'}
              >
                {currentQuestion.image_url ? (
                  <>
                    <img src={currentQuestion.image_url} alt="Question" className="image-upload-square__img" />
                    <span className="image-upload-square__remove" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                      </svg>
                    </span>
                  </>
                ) : (
                  <span className="image-upload-square__placeholder"><LuImagePlus /></span>
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
              onChange={onQuestionChange}
              placeholder="Explain why this is the correct answer..."
              disabled={loading}
              rows="3"
            />
          </div>

          {/* Options Section */}
          <div className="form-group">
            <label>Mark the correct answer(s) *</label>
            <div className="options-editor">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={`option-input-group ${index === currentQuestion.options.length - 1 && !String(option.text || '').trim() ? 'option-input-group--placeholder' : ''}`}
                >
                  <label className="custom-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={option.is_correct}
                      onChange={(e) => onOptionChange(index, 'is_correct', e.target.checked)}
                      disabled={loading}
                      className="custom-checkbox-input"
                    />
                    <span className="custom-checkbox"></span>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => onOptionChange(index, 'text', e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      disabled={loading}
                      className="option-text-input"
                    />
                  </label>
                  <button
                    type="button"
                    className={`image-upload-square option-image-square ${option.image_url ? 'image-upload-square--has-image' : ''}`}
                    onClick={() => onImageButtonClick({ type: 'option', index })}
                    disabled={loading}
                    aria-label={option.image_url ? `Remove image for option ${index + 1}` : `Add image to option ${index + 1}`}
                  >
                    {option.image_url ? (
                      <>
                        <img src={option.image_url} alt={`Option ${index + 1}`} className="image-upload-square__img" />
                        <span className="image-upload-square__remove" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                          </svg>
                        </span>
                      </>
                    ) : (
                      <span className="image-upload-square__placeholder"><LuImagePlus /></span>
                    )}
                  </button>
                  {currentQuestion.options.length > 2 && String(option.text || '').trim() && (
                    <button
                      type="button"
                      onClick={() => onRemoveOption(index)}
                      disabled={loading}
                      className="btn-remove"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="option-buttons" style={{ justifyContent: 'space-between' }}>
              <div>
                <button
                  type="button"
                  onClick={onAddOption}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  + Add Option
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={onSaveQuestion}
                  disabled={loading}
                  className="btn primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <IoIosSave aria-hidden="true" size={20} />
                  <span>Save</span>
                </button>
              </div>
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
                onChange={onQuestionChange}
                placeholder="e.g., Python was created by _ in the year _."
                disabled={loading}
                rows="3"
              />
              <button
                type="button"
                className={`image-upload-square ${currentQuestion.image_url ? 'image-upload-square--has-image' : ''}`}
                onClick={() => onImageButtonClick({ type: 'question' })}
                disabled={loading}
                aria-label={currentQuestion.image_url ? 'Remove question image' : 'Add image to question'}
              >
                {currentQuestion.image_url ? (
                  <>
                    <img src={currentQuestion.image_url} alt="Question" className="image-upload-square__img" />
                    <span className="image-upload-square__remove" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                      </svg>
                    </span>
                  </>
                ) : (
                  <span className="image-upload-square__placeholder"><LuImagePlus /></span>
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
                            <div
                              key={optionIndex}
                              className={`option-input-group ${optionIndex === options.length - 1 && !String(option.text || '').trim() ? 'option-input-group--placeholder' : ''}`}
                            >
                              <label className="custom-checkbox-wrapper">
                                <input
                                  type="checkbox"
                                  checked={!!option.is_correct}
                                  onChange={(e) => onGapOptionChange(gapIndex, optionIndex, 'is_correct', e.target.checked)}
                                  disabled={loading}
                                  className="custom-checkbox-input"
                                />
                                <span className="custom-checkbox"></span>
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => onGapOptionChange(gapIndex, optionIndex, 'text', e.target.value)}
                                  placeholder={`Option ${optionIndex + 1}`}
                                  disabled={loading}
                                  className="option-text-input"
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                        
                        <div style={{ marginTop: '12px' }}>
                          <label htmlFor={`gap-explanation-${gapIndex}`} style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
                            Explanation for Gap {gapIndex + 1} (optional)
                          </label>
                          <textarea
                            id={`gap-explanation-${gapIndex}`}
                            value={gap.explanation || ''}
                            onChange={(e) => onGapExplanationChange(gapIndex, e.target.value)}
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

          <div className="option-buttons" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onSaveQuestion}
              disabled={loading}
              className="btn primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <IoIosSave aria-hidden="true" size={22} />
              <span>Save</span>
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default QuestionEditor;
