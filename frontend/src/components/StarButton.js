function StarButton({ active, onToggle, size = 44, title, disabled = false }) {
  const handleClick = (event) => {
    event.stopPropagation();
    if (disabled) return;
    if (onToggle) onToggle();
  };

  const label = title || (active ? 'Remove from favorites' : 'Save to favorites');

  return (
    <button
      type="button"
      className={`star-button${active ? ' star-button--active' : ''}`}
      onClick={handleClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      style={{ width: `${size}px`, height: `${size}px` }}
      disabled={disabled}
    >
      {active ? '★' : '☆'}
    </button>
  );
}

export default StarButton;
