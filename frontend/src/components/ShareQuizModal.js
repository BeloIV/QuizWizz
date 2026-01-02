import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

function ShareQuizModal({ quiz, onClose }) {
    const { user, allUsers } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [recentUsers, setRecentUsers] = useState([]);

    useEffect(() => {
        if (user) {
            loadRecentInteractions();
        }
    }, [user]);

    const loadRecentInteractions = async () => {
        if (!user) return;
        
        try {
            // Get all messages to find recent interactions
            const response = await axios.get(`${API_BASE_URL}/messages/`, {
                withCredentials: true,
            });
            
            // Create a map of user ID -> last interaction timestamp
            const userLastInteraction = {};
            
            response.data.forEach(msg => {
                const otherUserId = msg.sender.id === user.id ? msg.recipient.id : msg.sender.id;
                const messageTime = new Date(msg.created_at).getTime();
                
                if (!userLastInteraction[otherUserId] || messageTime > userLastInteraction[otherUserId]) {
                    userLastInteraction[otherUserId] = messageTime;
                }
            });
            
            // Sort users by last interaction and take top 3
            const sortedUsers = allUsers
                .filter(u => u.id !== user.id && userLastInteraction[u.id])
                .sort((a, b) => userLastInteraction[b.id] - userLastInteraction[a.id])
                .slice(0, 3);
            
            setRecentUsers(sortedUsers);
        } catch (error) {
            console.error('Error loading recent interactions:', error);
            setRecentUsers([]);
        }
    };

    const handleShare = async (e) => {
        e.preventDefault();
        if (!selectedUserId || !user) return;

        setSending(true);
        setError('');
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
            // Also send a message about the share
            await axios.post(
                `${API_BASE_URL}/messages/`,
                {
                    recipient_id: parseInt(selectedUserId),
                    content: `I shared a quiz with you: "${quiz.name}"`,
                },
                { withCredentials: true }
            );
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Error sharing quiz:', error);
            const errorMessage = error.response?.data?.detail || 
                                error.response?.data?.error ||
                                'Failed to share quiz. It may have already been shared with this user.';
            setError(errorMessage);
        } finally {
            setSending(false);
        }
    };

    const otherUsers = allUsers.filter(u => !user || u.id !== user.id);
    
    // Filter users based on search term
    const filteredUsers = searchTerm 
        ? otherUsers.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()))
        : recentUsers;

    const selectUser = (userId) => {
        setSelectedUserId(userId.toString());
        setSearchTerm(''); // Clear search after selecting
    };

    if (!user) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h2>Share Quiz</h2>
                    <p>Please login to share quizzes</p>
                    <button onClick={onClose} className="btn btn-secondary">
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
                        {error && (
                            <div className="error-message">
                                <p>⚠ {error}</p>
                            </div>
                        )}
                        
                        <div className="form-group">
                            <label htmlFor="search-user">Search user:</label>
                            <input
                                type="text"
                                id="search-user"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by username..."
                                disabled={sending}
                                className="user-search-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                {searchTerm ? 'Search results:' : 'Recent contacts:'}
                            </label>
                            <div className="user-selection-list">
                                {filteredUsers.length === 0 ? (
                                    <p className="no-users-found">
                                        {searchTerm ? 'No users found' : 'No recent contacts. Use search to find users.'}
                                    </p>
                                ) : (
                                    filteredUsers.map(u => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            className={`user-selection-item ${selectedUserId === u.id.toString() ? 'selected' : ''}`}
                                            onClick={() => selectUser(u.id)}
                                            disabled={sending}
                                        >
                                            <span className="user-avatar-small">{u.username.charAt(0).toUpperCase()}</span>
                                            <span className="user-name-display">{u.username}</span>
                                            {selectedUserId === u.id.toString() && (
                                                <span className="selected-check">✓</span>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
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
                            <button type="submit" className="btn btn-primary" disabled={sending || !selectedUserId}>
                                {sending ? 'Sharing...' : 'Share Quiz'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-secondary"
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
