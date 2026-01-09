import GapQuestion from './GapQuestion';
import OptionsDisplay from './OptionsDisplay';
import { groupOptionsByGap } from '../../utils/gapEncoding';

/**
 * Component for displaying the current question with its options/gaps
 */
function QuestionDisplay({
  currentQuestion,
  isFillGapQuestion,
  quizHasMultiAnswer,
  selectedIndex,
  selectedIndices,
  verifiedCorrectIndices,
  tempIncorrectIndices,
  disabledForQuestion,
  reveal,
  correctIndices,
  processing,
  isSubmitDisabled,
  gapSelections,
  gapTempIncorrect,
  gapVerifiedCorrect,
  onOptionClick,
  onGapSelectionChange,
  onSubmit,
}) {
  // Parse gap explanations for fill-in-the-gap questions
  let gapExplanations = {};
  if (isFillGapQuestion && currentQuestion.explanation) {
    try {
      gapExplanations = JSON.parse(currentQuestion.explanation);
    } catch {
      // If parsing fails, explanations will be empty
    }
  }

  return (
    <div className="card">
      {currentQuestion.image_url && (
        <div className="question-image-wrapper">
          <img src={currentQuestion.image_url} alt="Question" className="question-image" />
        </div>
      )}

      {isFillGapQuestion ? (
        <GapQuestion
          currentQuestion={currentQuestion}
          gapSelections={gapSelections}
          gapTempIncorrect={gapTempIncorrect}
          gapVerifiedCorrect={gapVerifiedCorrect}
          processing={processing}
          reveal={reveal}
          onGapSelectionChange={onGapSelectionChange}
        />
      ) : (
        <>
          <div className="question">{currentQuestion.text}</div>
          {quizHasMultiAnswer && (
            <div className="muted" style={{ fontSize: '14px', marginBottom: '12px' }}>
              Select all correct answers
            </div>
          )}
          <OptionsDisplay
            options={currentQuestion.options}
            quizHasMultiAnswer={quizHasMultiAnswer}
            selectedIndex={selectedIndex}
            selectedIndices={selectedIndices}
            verifiedCorrectIndices={verifiedCorrectIndices}
            tempIncorrectIndices={tempIncorrectIndices}
            disabledForQuestion={disabledForQuestion}
            reveal={reveal}
            correctIndices={correctIndices}
            processing={processing}
            onOptionClick={onOptionClick}
          />
        </>
      )}

      {/* Show explanation when answer is revealed */}
      {reveal && (
        <>
          {isFillGapQuestion ? (
            // For fill-in-the-gap questions, show explanation per gap
            (() => {
              const gapMap = groupOptionsByGap(currentQuestion.options || []);
              const gapIndices = Array.from(gapMap.keys()).sort((a, b) => a - b);
              
              return gapIndices.map((gIdx) => {
                const gapExplanation = gapExplanations[gIdx];
                if (!gapExplanation) return null;
                
                return (
                  <div
                    key={`explanation-${gIdx}`}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(110, 168, 255, 0.12)',
                      borderRadius: '10px',
                      borderLeft: '3px solid var(--primary)',
                      marginTop: '12px',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: '6px',
                        color: 'var(--primary)',
                        fontSize: '14px',
                      }}
                    >
                      Gap {gIdx + 1} Explanation:
                    </div>
                    <div
                      style={{
                        color: 'var(--text)',
                        fontSize: '14px',
                        lineHeight: '1.5',
                      }}
                    >
                      {gapExplanation}
                    </div>
                  </div>
                );
              });
            })()
          ) : (
            // For regular questions, show single explanation
            currentQuestion.explanation && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(110, 168, 255, 0.12)',
                  borderRadius: '10px',
                  borderLeft: '3px solid var(--primary)',
                  marginTop: '12px',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--primary)',
                    fontSize: '14px',
                  }}
                >
                  Explanation:
                </div>
                <div
                  style={{
                    color: 'var(--text)',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                >
                  {currentQuestion.explanation}
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* Continue button moved to page footer in Play */}
    </div>
  );
}

export default QuestionDisplay;
