/**
 * Utility functions for encoding and decoding fill-in-the-gap quiz questions.
 * Gap options are encoded with a marker format: __G{gapIndex}__{optionText}
 */

/**
 * Check if a question is a fill-in-the-gap type by analyzing text and options
 * @param {Object} question - Question object with text and options
 * @returns {boolean} - True if question contains gaps and encoded options
 */
export function isFillGapQuestion(question) {
  if (!question?.text || typeof question.text !== 'string') return false;
  if (!Array.isArray(question.options) || question.options.length === 0) return false;
  
  const hasGap = /_{1,}/.test(question.text);
  const hasEncodedOptions = question.options.some(
    (opt) => typeof opt.text === 'string' && /^__G\d+__/.test(opt.text)
  );
  
  return hasGap && hasEncodedOptions;
}

/**
 * Count the number of gaps in question text
 * @param {string} text - Question text with gaps (underscores)
 * @returns {number} - Number of gaps found
 */
export function countGaps(text) {
  if (!text || typeof text !== 'string') return 0;
  const gapMatches = text.match(/_{1,}/g) || [];
  return gapMatches.length;
}

/**
 * Encode gap options into flat options array with gap markers
 * @param {Array} gapOptions - Array of gap objects with options and explanations
 * @returns {Object} - { options: flatOptions array, explanations: JSON string }
 */
export function encodeGapOptions(gapOptions) {
  if (!Array.isArray(gapOptions)) return { options: [], explanations: '' };
  
  const flatOptions = [];
  const gapExplanations = {};
  let flatIndex = 0;
  
  for (let g = 0; g < gapOptions.length; g += 1) {
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
  
  const explanations = Object.keys(gapExplanations).length > 0 
    ? JSON.stringify(gapExplanations) 
    : '';
  
  return { options: flatOptions, explanations };
}

/**
 * Decode flat options array back into per-gap structure
 * @param {Array} options - Flat options array with encoded gap markers
 * @param {string} explanationJSON - JSON string of gap explanations
 * @returns {Array} - Array of gap objects with options and explanations
 */
export function decodeGapOptions(options, explanationJSON = '') {
  if (!Array.isArray(options)) return [];
  
  const gapMap = new Map();
  
  options.forEach((option) => {
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
  
  // Parse gap explanations
  let gapExplanations = {};
  if (explanationJSON) {
    try {
      gapExplanations = JSON.parse(explanationJSON);
    } catch (e) {
      // Not JSON, ignore
    }
  }
  
  const gapOptions = [];
  const gapIndices = Array.from(gapMap.keys()).sort((a, b) => a - b);
  
  gapIndices.forEach((gapIndex) => {
    gapOptions.push({
      options: gapMap.get(gapIndex),
      explanation: gapExplanations[gapIndex] || '',
    });
  });
  
  return gapOptions;
}

/**
 * Remove underscore marker from gap option text
 * @param {string} text - Option text, potentially with __G marker
 * @returns {string} - Clean option text
 */
export function stripGapMarker(text) {
  if (typeof text !== 'string') return text;
  const match = text.match(/^__G\d+__(.*)$/);
  return match ? match[1] : text;
}

/**
 * Group options by gap index for display/selection
 * @param {Array} options - Flat options array with gap markers
 * @returns {Map} - Map of gapIndex -> array of { option, label, globalIndex }
 */
export function groupOptionsByGap(options) {
  const gapMap = new Map();
  
  if (!Array.isArray(options)) return gapMap;
  
  options.forEach((opt) => {
    if (typeof opt.text !== 'string') return;
    const match = opt.text.match(/^__G(\d+)__(.*)$/);
    if (!match) return;
    const gIdx = parseInt(match[1], 10);
    if (!gapMap.has(gIdx)) {
      gapMap.set(gIdx, []);
    }
    gapMap.get(gIdx).push({ 
      option: opt, 
      label: match[2], 
      globalIndex: opt.index 
    });
  });
  
  return gapMap;
}

/**
 * Validate gap question structure and options
 * @param {string} text - Question text
 * @param {Array} gapOptions - Array of gap objects
 * @returns {Object} - { valid: boolean, error: string }
 */
export function validateGapQuestion(text, gapOptions) {
  const gapCount = countGaps(text);
  
  if (gapCount === 0) {
    return { 
      valid: false, 
      error: 'Fill-in-the-gap question must contain at least one _ (gap)' 
    };
  }
  
  if (!Array.isArray(gapOptions) || gapOptions.length !== gapCount) {
    return { 
      valid: false, 
      error: 'Please define options for every gap' 
    };
  }
  
  // Validate each gap
  for (let g = 0; g < gapCount; g += 1) {
    const gap = gapOptions[g];
    const options = Array.isArray(gap?.options) ? gap.options : [];
    
    if (options.length < 2) {
      return { 
        valid: false, 
        error: `Gap ${g + 1} must have at least 2 options` 
      };
    }
    
    if (options.some((opt) => !opt.text.trim())) {
      return { 
        valid: false, 
        error: `Gap ${g + 1} has an option without text` 
      };
    }
    
    const correctCount = options.filter((opt) => opt.is_correct).length;
    const incorrectCount = options.length - correctCount;
    
    if (correctCount < 1 || incorrectCount < 1) {
      return { 
        valid: false, 
        error: `Gap ${g + 1} needs at least 1 correct and 1 incorrect option` 
      };
    }
  }
  
  return { valid: true, error: null };
}
