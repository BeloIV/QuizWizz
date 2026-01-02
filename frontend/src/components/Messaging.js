import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';
import { API_BASE_URL } from '../config';

function Messaging() {
    const { user, allUsers } = useAuth();
    const { unreadByUser, markConversationAsRead, loadUnreadCounts } = useMessages();
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [conversationUsers, setConversationUsers] = useState([]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (user && allUsers.length > 0) {
            loadConversationUsers();
            
            // Poll for new conversations every 10 seconds
            const interval = setInterval(() => {
                loadConversationUsers();
            }, 10000);
            
            return () => clearInterval(interval);
        }
    }, [user, allUsers]);

    useEffect(() => {
        if (selectedUser) {
            loadConversation(selectedUser.id, false);
            
            // Poll for new messages every 3 seconds (silent refresh)
            const interval = setInterval(() => {
                loadConversation(selectedUser.id, true);
            }, 3000);
            
            return () => clearInterval(interval);
        }
    }, [selectedUser]);

    const loadConversationUsers = async () => {
        if (!user) return;
        
        try {
            // Get all messages for current user
            const response = await axios.get(`${API_BASE_URL}/messages/`, {
                withCredentials: true,
            });
            
            console.log('All messages:', response.data);
            
            // Create a map of user ID -> last message timestamp
            const userLastMessage = {};
            
            response.data.forEach(msg => {
                const otherUserId = msg.sender.id === user.id ? msg.recipient.id : msg.sender.id;
                const messageTime = new Date(msg.created_at).getTime();
                
                // Keep only the most recent message time for each user
                if (!userLastMessage[otherUserId] || messageTime > userLastMessage[otherUserId]) {
                    userLastMessage[otherUserId] = messageTime;
                }
            });
            
            console.log('User last message times:', userLastMessage);
            
            // Filter allUsers to only include users with conversations and sort by last message
            const usersWithConversations = allUsers
                .filter(u => userLastMessage[u.id])
                .sort((a, b) => userLastMessage[b.id] - userLastMessage[a.id]);
            
            console.log('Users with conversations (sorted):', usersWithConversations);
            setConversationUsers(usersWithConversations);
        } catch (error) {
            console.error('Error loading conversation users:', error);
            setConversationUsers([]);
        }
    };

    const loadConversation = async (userId, silent = false) => {
        if (!silent) {
            setLoading(true);
        }
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
            if (!silent) {
                setLoading(false);
            }
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
            // Reload conversation to show the new message
            loadConversation(selectedUser.id, false);
            // Refresh the conversation users list
            loadConversationUsers();
            // Refresh unread counts
            loadUnreadCounts();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    // Show all users for search, but highlight those with conversations
    const otherUsers = allUsers.filter(u => !user || u.id !== user.id);
    
    // If no search term, show only users with conversations
    // If searching, show all matching users
    const usersToShow = searchTerm ? otherUsers : conversationUsers;

    const filteredUsers = usersToShow.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectUser = (selectedUserObj) => {
        setSelectedUser(selectedUserObj);
        setSearchTerm(''); // Clear search when user is selected
        // Mark conversation as read when opened
        markConversationAsRead(selectedUserObj.id);
    };

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
            <div className={`messaging-container ${selectedUser ? 'has-selected-user' : ''}`}>
                {/* Sidebar */}
                <div className="messaging-sidebar">
                    <div className="sidebar-header">
                        <h3>Messages</h3>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="user-search-input"
                        />
                    </div>
                    <div className="user-list">
                        {filteredUsers.length === 0 ? (
                            <p className="no-users">
                                {searchTerm ? 'No users found' : 'No conversations yet. Search for users to start chatting!'}
                            </p>
                        ) : (
                            filteredUsers.map(u => (
                                <button
                                    key={u.id}
                                    className={`user-list-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                                    onClick={() => handleSelectUser(u)}
                                >
                                    <span className="user-avatar">{u.username.charAt(0).toUpperCase()}</span>
                                    <span className="user-name">{u.username}</span>
                                    {unreadByUser[u.id] > 0 && (
                                        <span className="badge badge-user">{unreadByUser[u.id]}</span>
                                    )}
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
                                    <button 
                                        className="back-button"
                                        onClick={() => setSelectedUser(null)}
                                        title="Back to user list"
                                    >
                                        ←
                                    </button>
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
                                <div ref={messagesEndRef} />
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
                            <div className="no-user-icon">💬</div>
                            <h3>Select a user to start chatting</h3>
                            <p>Search for a user in the sidebar and click to open a conversation</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Messaging;
