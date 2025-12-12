import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

function ShareQuizModal({ quiz, onClose }) {
    const { user, allUsers } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleShare = async (e) => {
        e.preventDefault();
        if (!selectedUserId || !user) return;

        setSending(true);
        try {
            await axios.post(
                `${API_BASE_URL}/quiz-shares/`,
                {
                    quiz_id: quiz.id,
                    recipient_id: parseInt(selectedUserId),
                    message: message,
                },
                { withCredentials: true }
            );
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Error sharing quiz:', error);
            alert('Failed to share quiz. It may have already been shared with this user.');
        } finally {
            setSending(false);
        }
    };

    const otherUsers = allUsers.filter(u => !user || u.id !== user.id);

    if (!user) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h2>Share Quiz</h2>
                    <p>Please login to share quizzes</p>
                    <button onClick={onClose} className="btn-secondary">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content share-quiz-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Share "{quiz.name}"</h2>

                {success ? (
                    <div className="success-message">
                        <p>✓ Quiz shared successfully!</p>
                    </div>
                ) : (
                    <form onSubmit={handleShare} className="share-quiz-form">
                        <div className="form-group">
                            <label htmlFor="recipient">Share with:</label>
                            <select
                                id="recipient"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                required
                                disabled={sending}
                            >
                                <option value="">Select a user</option>
                                {otherUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Message (optional):</label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Add a message..."
                                rows="3"
                                disabled={sending}
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="submit" className="btn-primary" disabled={sending}>
                                {sending ? 'Sharing...' : 'Share Quiz'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-secondary"
                                disabled={sending}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ShareQuizModal;
