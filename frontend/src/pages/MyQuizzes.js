import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuizList } from '../context/QuizContext';
import LoginModal from "../components/LoginModal.js";
import RegisterModal from "../components/RegisterModal.js";

function MyQuizzes() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const loginCanceledRef = useRef(false);
  const { quizzes, loading, deleteQuiz } = useQuizList();
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      loginCanceledRef.current = false;
      setShowLoginModal(true);
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (waitingForAuth && !authLoading) {
      setWaitingForAuth(false);
      if (!isAuthenticated && loginCanceledRef.current) {
        navigate('/');
      }
    }
  }, [waitingForAuth, authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    // Filter quizzes authored by current user
    if (user && quizzes) {
      const userQuizzes = quizzes.filter(quiz => quiz.author === user.username);
      setMyQuizzes(userQuizzes);
    }
  }, [user, quizzes, isAuthenticated, navigate]);

  const handleEdit = (quizId) => {
    navigate(`/edit/${quizId}`);
  };

  const handleDeleteClick = (quiz) => {
    setDeleteConfirm(quiz);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteQuiz(deleteConfirm.id);
      setPopup({ message: 'Quiz deleted successfully', type: 'success' });
      setDeleteConfirm(null);
      
      // Clear popup after 2 seconds
      setTimeout(() => setPopup(null), 2000);
    } catch (error) {
      setPopup({ message: error.message || 'Failed to delete quiz', type: 'error' });
      setDeleteConfirm(null);
      
      setTimeout(() => setPopup(null), 3000);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="my-quizzes">
        <h1 className="page-title">My Quizzes</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="my-quizzes">
      <h1 className="page-title">My Quizzes</h1>
      
      {myQuizzes.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any quizzes yet.</p>
          <button
            className="btn primary"
            onClick={() => navigate('/create')}
          >
            Create Your First Quiz
          </button>
        </div>
      ) : (
        <div className="quizzes-grid">
          {myQuizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-card-header">
                <div className="quiz-icon">{quiz.icon || '📝'}</div>
                <h3 className="quiz-title">{quiz.name}</h3>
              </div>
              
              <div className="quiz-card-body">
                {quiz.tags && quiz.tags.length > 0 && (
                  <div className="quiz-tags">
                    {quiz.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="quiz-stats">
                  <span>Questions: {quiz.question_count || 0}</span>
                  <span>👍 {quiz.likes || 0}</span>
                  <span>👎 {quiz.dislikes || 0}</span>
                </div>
              </div>
              
              <div className="quiz-card-actions">
                <button
                  className="btn"
                  onClick={() => navigate(`/quiz/${quiz.id}`)}
                >
                  View
                </button>
                <button
                  className="btn primary"
                  onClick={() => handleEdit(quiz.id)}
                >
                  Edit
                </button>
                <button
                  className="btn danger"
                  onClick={() => handleDeleteClick(quiz)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Quiz</h3>
            <p className="modal-message">
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="btn danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Notification */}
      {popup && (
        <div
          className={`popup ${popup.type === 'error' ? 'popup--danger' : 'popup--success'} popup--top`}
          role="alert"
          aria-live="assertive"
        >
          {popup.message}
        </div>
      )}

      <LoginModal
          isOpen={showLoginModal}
          onClose={() => {
            const wasCanceled = !isAuthenticated;
            loginCanceledRef.current = wasCanceled;
            setShowLoginModal(false);
            if (wasCanceled) setWaitingForAuth(true);
          }}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
      />

      <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => {
            const wasCanceled = !isAuthenticated;
            loginCanceledRef.current = wasCanceled;
            setShowRegisterModal(false);
            if (wasCanceled) setWaitingForAuth(true);
          }}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
      />
    </div>
  );
}

export default MyQuizzes;
