import { useCallback } from 'react';

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
  onAddGapOption,
  onRemoveGapOption,
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
                <div key={index} className="option-input-group">
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
                        <span className="image-upload-square__remove">×</span>
                      </>
                    ) : (
                      <span className="image-upload-square__placeholder">Img</span>
                    )}
                  </button>
                  {currentQuestion.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => onRemoveOption(index)}
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
                onClick={onAddOption}
                disabled={loading}
                className="btn"
              >
                + Add Option
              </button>

              <button
                type="button"
                onClick={onSaveQuestion}
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
                              {options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveGapOption(gapIndex, optionIndex)}
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
                              onClick={() => onAddGapOption(gapIndex)}
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

          <div className="option-buttons">
            <button
              type="button"
              onClick={onSaveQuestion}
              disabled={loading}
              className="btn primary"
            >
              ✓ Save Question
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default QuestionEditor;
