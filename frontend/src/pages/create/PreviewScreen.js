import { stripGapMarker } from '../../utils/gapEncoding';

/**
 * Component for previewing the quiz before publishing
 */
function PreviewScreen({
  formData,
  loading,
  error,
  onBackToEdit,
  onPublish,
  onEditQuestion,
}) {
  const renderPreviewOptionText = (text) => {
    return stripGapMarker(text);
  };

  return (
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
                      onClick={() => onEditQuestion(qIndex)}
                      disabled={loading}
                      className="btn-edit-small"
                      aria-label="Edit question"
                      title="Edit question"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
                <p className="preview-question-text">{question.text}</p>
                {question.image_url && (
                    <img src={question.image_url} alt="Question" className="preview-question-image"/>
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
          onClick={onBackToEdit}
          disabled={loading}
          className="btn btn-secondary"
        >
          ← Back to Edit
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={loading}
          className="btn primary success"
        >
          {loading ? 'Creating...' : '✓ Publish Quiz'}
        </button>
      </div>
    </div>
  );
}

export default PreviewScreen;
