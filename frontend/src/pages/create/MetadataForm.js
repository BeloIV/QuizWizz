import { useCallback } from 'react';

/**
 * Component for editing quiz metadata (name, icon, tags)
 */
function MetadataForm({
  formData,
  tagInput,
  setTagInput,
  loading,
  isEditMode,
  onQuizChange,
  onAddTag,
  onRemoveTag,
  onSubmit,
  onCancel,
}) {
  const iconOptions = [
    '📝', '🧮', '➕', '🔢', '🌍', '🪐', '🔬', '💻', 
    '⚙️', '🎨', '🎭', '🎵', '📚', '🏆', '☕', '🚀', 
    '💡', '🎯', '🧪', '🎮'
  ];

  const favoriteTags = ['Math', 'Science', 'History', 'Fun', 'Technology'];

  const handleTagKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddTag();
    }
  }, [onAddTag]);

  return (
    <div>
      <div className="screen-header">
        <h1 className="page-title">{isEditMode ? 'Edit Quiz' : 'Create New Quiz'}</h1>
      </div>

      <form className="quiz-form" onSubmit={onSubmit}>
        <section className="form-section">
          <h2 className="section-title">Quiz Details</h2>

          <div className="form-group">
            <label htmlFor="name">Quiz Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={onQuizChange}
              placeholder="e.g., Python Basics Review"
              disabled={loading}
              required
            />
          </div>

          {/* Icon Selector */}
          <div className="form-group">
            <label htmlFor="icon">Quiz Icon</label>
            <div className="icon-selector">
              {iconOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`icon-option ${formData.icon === emoji ? 'selected' : ''}`}
                  onClick={() => onQuizChange({ target: { name: 'icon', value: emoji } })}
                  disabled={loading}
                  aria-label={`Select ${emoji} icon`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Section */}
          <div className="form-group">
            <label>Tags</label>

            {/* Predefined Favorite Tags */}
            <div className="favorite-tags">
              {favoriteTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`favorite-tag ${formData.tags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => {
                    if (!formData.tags.includes(tag)) {
                      onQuizChange({ 
                        target: { 
                          name: 'tags', 
                          value: [...formData.tags, tag] 
                        } 
                      });
                    }
                  }}
                  disabled={loading || formData.tags.includes(tag)}
                  aria-label={`Add ${tag} tag`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="tag-input-group">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Or add a custom tag and press Enter"
                disabled={loading}
              />
              <button type="button" onClick={onAddTag} disabled={loading} className="btn">
                Add Tag
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="tags-list">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="pill">
                    {tag}
                    <button
                      type="button"
                      onClick={() => onRemoveTag(index)}
                      disabled={loading}
                      className="pill-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      </form>

      {/* Bottom action buttons */}
      <div className="footer-actions row" style={{ justifyContent: 'space-between', marginTop: '24px' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="btn primary"
          aria-label="Continue to questions"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default MetadataForm;
