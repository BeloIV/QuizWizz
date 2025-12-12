import { groupOptionsByGap } from '../../utils/gapEncoding';

/**
 * Component for rendering fill-in-the-gap questions with dropdown selects
 */
function GapQuestion({
  currentQuestion,
  gapSelections,
  gapTempIncorrect,
  gapVerifiedCorrect,
  processing,
  reveal,
  onGapSelectionChange,
}) {
  const parts = currentQuestion.text.split(/(_{1,})/);
  const gapMap = groupOptionsByGap(currentQuestion.options || []);
  const gapIndices = Array.from(gapMap.keys()).sort((a, b) => a - b);

  let gapCounter = 0;
  const rendered = [];

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (part.match(/^_{1,}$/)) {
      const gIdx = gapCounter;
      const optionsForGap = gapMap.get(gIdx) || [];
      const selectValue = gapSelections[gIdx] ?? '';
      const isIncorrect = gapTempIncorrect.includes(gIdx);
      const isCorrect = gapVerifiedCorrect.includes(gIdx);
      const selectClassNames = ['gap-select'];
      if (isIncorrect) selectClassNames.push('incorrect');
      if (isCorrect) selectClassNames.push('correct');

      rendered.push(
        <select
          key={`gap-${gIdx}`}
          className={selectClassNames.join(' ')}
          value={selectValue}
          onChange={(e) => {
            const value = e.target.value === '' ? null : Number(e.target.value);
            onGapSelectionChange(gIdx, value);
          }}
          disabled={processing || reveal}
        >
          <option value="">Select...</option>
          {optionsForGap.map((entry) => (
            <option key={entry.globalIndex} value={entry.globalIndex}>
              {entry.label}
            </option>
          ))}
        </select>
      );
      gapCounter += 1;
    } else if (part) {
      rendered.push(
        <span key={`text-${i}`}>{part}</span>
      );
    }
  }

  return <div className="question">{rendered}</div>;
}

export default GapQuestion;
