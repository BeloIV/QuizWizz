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

    if (!user) {
        return (
            <div className="messaging-container">
                <p>Please login to use messaging</p>
            </div>
        );
    }

    return (
        <div className="messaging-container">
            <div className="messaging-sidebar">
                <h3>Users</h3>
                <div className="user-list">
                    {otherUsers.map(u => (
                        <button
                            key={u.id}
                            className={`user-list-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                            onClick={() => setSelectedUser(u)}
                        >
                            {u.username}
                        </button>
                    ))}
                </div>
            </div>

            <div className="messaging-main">
                {selectedUser ? (
                    <>
                        <div className="messaging-header">
                            <h3>Chat with {selectedUser.username}</h3>
                        </div>

                        <div className="messages-list">
                            {loading ? (
                                <p>Loading messages...</p>
                            ) : messages.length === 0 ? (
                                <p className="no-messages">No messages yet. Start a conversation!</p>
                            ) : (
                                messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`message ${msg.sender.id === user?.id ? 'message-sent' : 'message-received'}`}
                                    >
                                        <div className="message-sender">{msg.sender.username}</div>
                                        <div className="message-content">{msg.content}</div>
                                        <div className="message-time">
                                            {new Date(msg.created_at).toLocaleString()}
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
                            <button type="submit" className="btn-primary">
                                Send
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
    );
}

export default Messaging;
