/**
 * Component for rendering multiple choice options (single or multi-select)
 */
function OptionsDisplay({
  options,
  quizHasMultiAnswer,
  selectedIndex,
  selectedIndices,
  verifiedCorrectIndices,
  tempIncorrectIndices,
  disabledForQuestion,
  reveal,
  correctIndices,
  processing,
  onOptionClick,
}) {
  return (
    <div className="options" id="options">
      {options.map((option) => {
        const optionIndex = option.index;
        const classNames = ['option'];

        if (disabledForQuestion.has(optionIndex)) {
          classNames.push('incorrect');
        }
        if (reveal && correctIndices.includes(optionIndex)) {
          classNames.push('correct');
        } else if (quizHasMultiAnswer && verifiedCorrectIndices.includes(optionIndex)) {
          classNames.push('correct');
        }

        if (quizHasMultiAnswer) {
          if (selectedIndices.includes(optionIndex)) {
            classNames.push('selected');
          }
          if (tempIncorrectIndices.includes(optionIndex)) {
            classNames.push('incorrect');
          }
        } else {
          if (selectedIndex === optionIndex) {
            classNames.push('selected');
          }
        }

        const isDisabled = processing || reveal || disabledForQuestion.has(optionIndex);

        return (
          <button
            key={optionIndex}
            type="button"
            className={classNames.join(' ')}
            onClick={() => onOptionClick(optionIndex)}
            disabled={isDisabled}
          >
            {option.image_url && (
              <span className="option-image-wrapper">
                <img src={option.image_url} alt={option.text} className="option-image" />
              </span>
            )}
            <span className="option-text">{option.text}</span>
          </button>
        );
      })}
    </div>
  );
}

export default OptionsDisplay;
