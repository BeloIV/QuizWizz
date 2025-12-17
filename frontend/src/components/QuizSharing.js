import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';

function QuizSharing() {
    const { user, allUsers } = useAuth();
    const [receivedShares, setReceivedShares] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            loadReceivedShares();
        }
    }, [user]);

    const loadReceivedShares = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/quiz-shares/received/`, {
                params: user ? {} : { user_id: user?.id },
                withCredentials: true,
            });
            setReceivedShares(response.data);
        } catch (error) {
            console.error('Error loading received shares:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsViewed = async (shareId) => {
        try {
            await axios.post(
                `${API_BASE_URL}/quiz-shares/${shareId}/mark_viewed/`,
                {},
                { withCredentials: true }
            );
            loadReceivedShares();
        } catch (error) {
            console.error('Error marking as viewed:', error);
        }
    };

    const openQuiz = (quizId, shareId) => {
        markAsViewed(shareId);
        navigate(`/quiz/${quizId}`);
    };

    if (!user) {
        return (
            <div className="quiz-sharing-container">
                <p>Please login to see shared quizzes</p>
            </div>
        );
    }

    return (
        <div className="quiz-sharing-container">
            <h2>Quizzes Shared With You</h2>

            {loading ? (
                <p>Loading...</p>
            ) : receivedShares.length === 0 ? (
                <p className="no-shares">No quizzes have been shared with you yet.</p>
            ) : (
                <div className="shares-list">
                    {receivedShares.map(share => (
                        <div
                            key={share.id}
                            className={`share-item ${!share.is_viewed ? 'share-unviewed' : ''}`}
                        >
                            <div className="share-header">
                                <span className="share-from">
                                    From: <strong>{share.sender.username}</strong>
                                </span>
                                <span className="share-date">
                                    {new Date(share.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="share-quiz">
                                <h3>{share.quiz_data.name}</h3>
                                <p className="share-author">by {share.quiz_data.author}</p>
                                {share.message && (
                                    <p className="share-message">"{share.message}"</p>
                                )}
                            </div>

                            <button
                                className="btn cta"
                                onClick={() => openQuiz(share.quiz_data.id, share.id)}
                            >
                                Take Quiz
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default QuizSharing;
