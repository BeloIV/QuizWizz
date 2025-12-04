import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQuizList } from '../context/QuizContext';
import { useSearch } from '../context/SearchContext';

function SearchOverlay() {
  const { open, preset, closeSearch } = useSearch();
  const { quizzes } = useQuizList();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);
  const bubbleRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSearchTerm(preset || '');
    } else {
      setSearchTerm('');
    }
  }, [open, preset]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const raf = requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (bubbleRef.current?.contains(event.target)) {
        return;
      }
      if (event.target.closest('[data-search-toggle]')) {
        return;
      }
      closeSearch();
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeSearch();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, closeSearch]);

  const normalizedTerm = searchTerm.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!normalizedTerm) {
      return [];
    }
    return quizzes
      .filter((quiz) => {
        const nameMatch = quiz.name.toLowerCase().includes(normalizedTerm);
        const tagMatch = quiz.tags.some((tag) => tag.toLowerCase().includes(normalizedTerm));
        return nameMatch || tagMatch;
      })
      .slice(0, 8);
  }, [normalizedTerm, quizzes]);

  const handleNavigate = (quizId) => {
    closeSearch();
    navigate(`/quiz/${quizId}`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (matches[0]) {
      handleNavigate(matches[0].id);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="search-bubble__backdrop" role="presentation" onClick={closeSearch} />
      <div className="search-bubble" role="dialog" aria-label="Search quizzes" ref={bubbleRef}>
        <form className="search-bubble__form" onSubmit={handleSubmit}>
          <div className="search-bubble__input-row">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle
                cx="11"
                cy="11"
                r="5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M15.8 15.8 20 20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={inputRef}
              className="search-bubble__input"
              placeholder="Search quizzes by name or tag"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search quizzes"
            />
          </div>
        </form>
        <div className="search-bubble__results" role="listbox" aria-label="Search results">
          {matches.length ? (
            matches.map((quiz) => (
              <button
                key={quiz.id}
                type="button"
                className="search-bubble__result"
                onClick={() => handleNavigate(quiz.id)}
              >
                <span className="search-bubble__result-title">{quiz.name}</span>
                <span className="search-bubble__result-meta muted">
                  {quiz.author} • {quiz.tags.join(', ')}
                </span>
              </button>
            ))
          ) : (
            <div className="search-bubble__empty muted">No quizzes found.</div>
          )}
        </div>
      </div>
    </>
  );
}

export default SearchOverlay;
