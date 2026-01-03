import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

function SharedQuizzes() {
  const { user, isAuthenticated } = useAuth();
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentError, setSentError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [recRes, sentRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/quiz-shares/received/`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/quiz-shares/sent/`, {
            withCredentials: true,
            validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
          }),
        ]);

        if (recRes.status === 'fulfilled') {
          setReceived(recRes.value.data);
        }
        if (sentRes.status === 'fulfilled') {
          if (sentRes.value.status === 404) {
            setSent([]);
            setSentError('Sent shares not available.');
          } else {
            setSent(sentRes.value.data);
            setSentError(null);
          }
        } else {
          setSent([]);
          setSentError('Sent shares not available.');
        }
      } catch (err) {
        console.error('Error loading shares', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return <div className="empty">Please log in to view shared quizzes.</div>;
  }

  return (
    <div className="stack" style={{ gap: '16px' }}>
      <h2 className="section-title">Shared quizzes</h2>

      {loading ? (
        <div className="muted">Loading…</div>
      ) : (
        <>
          <section className="card stack" style={{ gap: '10px' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Received</h3>
              <span className="pill">{received.length}</span>
            </div>
            {received.length === 0 ? (
              <div className="muted">No quizzes have been shared with you yet.</div>
            ) : (
              <div className="stack" style={{ gap: '10px' }}>
                {received.map((share) => (
                  <div key={share.id} className={`card stack ${!share.is_viewed ? 'share-unviewed' : ''}`} style={{ gap: '6px' }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="muted" style={{ fontSize: '13px' }}>From {share.sender.username}</span>
                      <span className="muted" style={{ fontSize: '12px' }}>{new Date(share.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <div className="quiz-card__title" style={{ margin: 0 }}>{share.quiz_data.name}</div>
                      <div className="quiz-card__author">by {share.quiz_data.author}</div>
                    </div>
                    {share.message && <div className="muted">“{share.message}”</div>}
                    <div className="row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                      {!share.is_viewed && <span className="pill">new</span>}
                      <button className="btn primary" onClick={() => navigate(`/quiz/${share.quiz_data.id}`)}>
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card stack" style={{ gap: '10px' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Shared by me</h3>
              <span className="pill">{sent.length}</span>
            </div>
            {sentError && <div className="muted" style={{ fontSize: '13px' }}>{sentError}</div>}
            {sent.length === 0 ? (
              <div className="muted">You haven't shared any quizzes yet.</div>
            ) : (
              <div className="stack" style={{ gap: '10px' }}>
                {sent.map((share) => (
                  <div key={share.id} className="card stack" style={{ gap: '6px' }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="muted" style={{ fontSize: '13px' }}>To {share.recipient.username}</span>
                      <span className="muted" style={{ fontSize: '12px' }}>{new Date(share.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <div className="quiz-card__title" style={{ margin: 0 }}>{share.quiz_data.name}</div>
                      <div className="quiz-card__author">by {share.quiz_data.author}</div>
                    </div>
                    {share.message && <div className="muted">“{share.message}”</div>}
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => navigate(`/quiz/${share.quiz_data.id}`)}>
                        View quiz
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default SharedQuizzes;
