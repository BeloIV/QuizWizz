import { stripGapMarker } from '../../utils/gapEncoding';

/**
 * Component for displaying the list of saved questions with edit/remove actions
 */
function QuestionsList({
  questions,
  editingQuestionIndex,
  loading,
  questionsListRef,
  questionsListFooterRef,
  onEditQuestion,
  onRemoveQuestion,
}) {
  const renderPreviewOptionText = (text) => {
    return stripGapMarker(text);
  };

  return (
    <section className="form-section" ref={questionsListRef}>
      <div className="questions-list-header">
        <h2 className="section-title">Added Questions ({questions.length})</h2>
      </div>
      <div className="questions-list">
        {questions.map((question, qIndex) => (
          <div key={qIndex} className={`question-preview ${editingQuestionIndex === qIndex ? 'editing' : ''}`}>
            <div className="question-preview__header">
              <p className="question-preview__text">{question.text}</p>
              <div className="question-preview__actions">
                <button
                  type="button"
                  onClick={() => onEditQuestion(qIndex)}
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
                  onClick={() => onRemoveQuestion(qIndex)}
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
  );
}

export default QuestionsList;
