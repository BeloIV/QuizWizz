import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

function Messaging() {
    const { user, allUsers } = useAuth();
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedUser) {
            loadConversation(selectedUser.id);
        }
    }, [selectedUser]);

    const loadConversation = async (userId) => {
        setLoading(true);
        try {
            const params = { user_id: userId };
            if (user) {
                // Authenticated request
                const response = await axios.get(`${API_BASE_URL}/messages/conversation/`, {
                    params,
                    withCredentials: true,
                });
                setMessages(response.data);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            const payload = {
                recipient_id: selectedUser.id,
                content: newMessage,
            };

            // If not authenticated, include sender_id
            if (!user) {
                return alert('Please login to send messages');
            }

            await axios.post(`${API_BASE_URL}/messages/`, payload, {
                withCredentials: true,
            });

            setNewMessage('');
            loadConversation(selectedUser.id);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    const otherUsers = allUsers.filter(u => !user || u.id !== user.id);

    useEffect(() => {
        if (user && otherUsers.length > 0 && !selectedUser) {
            setSelectedUser(otherUsers[0]);
        }
    }, [user, otherUsers, selectedUser]);

    if (!user) {
        return (
            <div className="messaging-page">
                <div className="messaging-empty">
                    <p>Please login to use messaging</p>
                </div>
            </div>
        );
    }

    return (
        <div className="messaging-page">
            <div className="messaging-container">
                {/* Sidebar */}
                <div className="messaging-sidebar">
                    <div className="sidebar-header">
                        <h3>Messages</h3>
                    </div>
                    <div className="user-list">
                        {otherUsers.length === 0 ? (
                            <p className="no-users">No users available</p>
                        ) : (
                            otherUsers.map(u => (
                                <button
                                    key={u.id}
                                    className={`user-list-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                                    onClick={() => setSelectedUser(u)}
                                >
                                    <span className="user-name">{u.username}</span>
                                    <span className="user-avatar">{u.username.charAt(0).toUpperCase()}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="messaging-main">
                    {selectedUser ? (
                        <>
                            <div className="messaging-header">
                                <div className="header-user-info">
                                    <div className="header-avatar">{selectedUser.username.charAt(0).toUpperCase()}</div>
                                    <h3>{selectedUser.username}</h3>
                                </div>
                            </div>

                            <div className="messages-list">
                                {loading ? (
                                    <div className="loading-messages">
                                        <p>Loading messages...</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="no-messages-area">
                                        <p>No messages yet. Start a conversation!</p>
                                    </div>
                                ) : (
                                    messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className={`message ${msg.sender.id === user?.id ? 'message-sent' : 'message-received'}`}
                                        >
                                            <div className="message-bubble">
                                                <div className="message-content">{msg.content}</div>
                                                <div className="message-time">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={sendMessage} className="message-input-form">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="message-input"
                                />
                                <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}>
                                    ➤
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="no-user-selected">
                            <p>Select a user to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Messaging;
