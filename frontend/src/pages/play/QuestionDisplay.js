import GapQuestion from './GapQuestion';
import OptionsDisplay from './OptionsDisplay';

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

      {!reveal && (
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="btn primary"
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            style={{ width: '100%' }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

export default QuestionDisplay;
