import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

// Helper to derive initials from username
function getInitials(username) {
  if (!username) return '?';
  const trimmed = String(username).trim();
  if (!trimmed) return '?';
  const letters = trimmed.replace(/[^a-zA-Z0-9]/g, '') || trimmed;
  return letters.slice(0, 2).toUpperCase();
}

// Simple deterministic color from string
function stringToColor(str) {
  if (!str) return '#888888';
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash &= hash; // force 32bit
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += (`00${value.toString(16)}`).slice(-2);
  }
  return color;
}

const EMOJIS = ['🙂', '😍', '🎉', '🤔', '😡'];

function CommentsSection({ quizId }) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [posting, setPosting] = useState(false);

  const listEndRef = useRef(null);
  const observerRef = useRef(null);
  const textareaRef = useRef(null);

  const hasMore = nextPage != null;

  const fetchPage = useCallback(async (targetPage) => {
    if (!quizId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/comments/?page=${targetPage}&page_size=10`);
      if (!response.ok) {
        throw new Error(`Failed to load comments (${response.status})`);
      }
      const data = await response.json();
      setComments((prev) => (targetPage === 1 ? data.results : [...prev, ...data.results]));
      setNextPage(data.next_page);
    } catch (err) {
      console.error('Failed to load comments', err);
      setError(err.message || 'Unable to load comments');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    setComments([]);
    setNextPage(null);
    setInitialLoading(true);
    if (quizId) {
      fetchPage(1);
    }
  }, [quizId, fetchPage]);

  useEffect(() => {
    if (!hasMore || loading) return;
    if (!listEndRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loading && hasMore) {
        fetchPage(nextPage);
      }
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 1.0,
    });

    observerRef.current.observe(listEndRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, nextPage, fetchPage]);

  const handleInsertEmoji = (emoji) => {
    if (!textareaRef.current) {
      setInputValue((prev) => prev + emoji);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart ?? inputValue.length;
    const end = el.selectionEnd ?? inputValue.length;
    const newValue = `${inputValue.slice(0, start)}${emoji}${inputValue.slice(end)}`;
    setInputValue(newValue);
    requestAnimationFrame(() => {
      el.focus();
      const caretPos = start + emoji.length;
      el.setSelectionRange(caretPos, caretPos);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated || !quizId) return;
    const text = inputValue.trim();
    if (!text) return;

    setPosting(true);
    setError(null);
    try {
      const csrfToken = document.cookie.split('; ').find((row) => row.startsWith('csrftoken='))?.split('=')[1];
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/comments/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to post comment (${response.status})`);
      }
      const newComment = await response.json();
      setComments((prev) => [newComment, ...prev]);
      setInputValue('');
    } catch (err) {
      console.error('Failed to post comment', err);
      setError(err.message || 'Unable to post comment');
    } finally {
      setPosting(false);
    }
  };

  const renderAvatar = (username) => {
    const initials = getInitials(username);
    const bg = stringToColor(username || '');
    return (
      <div
        className="comment-avatar"
        style={{ backgroundColor: bg }}
      >
        {initials}
      </div>
    );
  };

  return (
    <section className="form-section comments-section">
      <h2 className="section-title comments-section__header">Comments</h2>

      {isAuthenticated ? (
        <form
          onSubmit={handleSubmit}
          className="comments-form"
        >
          <div className="comments-form__row">
            {renderAvatar(user?.username)}
            <div className="comments-form__main">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="comments-textarea"
              />
              <div className="comments-form__footer">
                <div className="comments-form__emojis-container">
                  <div className="comments-form__emojis">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleInsertEmoji(emoji)}
                        className="comments-emoji-btn"
                        aria-label={`Insert ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn primary comments-submit-btn"
                  disabled={posting || !inputValue.trim()}
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="muted comments-login-hint">
          Log in to post a comment.
        </div>
      )}

      {error && (
        <div className="error-banner comments-error">
          {error}
        </div>
      )}

      {initialLoading && (
        <div className="muted comments-loading">Loading comments...</div>
      )}

      {!initialLoading && comments.length === 0 && !error && (
        <div className="muted comments-empty">No comments yet. Be the first to comment!</div>
      )}

      <div className="comments-list">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="comment-item"
          >
            {renderAvatar(comment.user)}
            <div className="comment-body">
              <div className="comment-body__header">
                <span className="comment-body__username">{comment.user}</span>
                <span className="muted comment-body__meta">
                  {comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}
                </span>
              </div>
              <div className="comment-body__text">{comment.text}</div>
            </div>
          </div>
        ))}
        <div ref={listEndRef} />
        {loading && !initialLoading && (
          <div className="muted comments-loading-more">Loading more comments...</div>
        )}
      </div>
    </section>
  );
}

export default CommentsSection;
