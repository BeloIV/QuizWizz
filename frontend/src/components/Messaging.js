import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';
import { API_BASE_URL } from '../config';
import LoginModal from "./LoginModal.js";
import RegisterModal from "./RegisterModal.js";

function Messaging() {
    const { user, allUsers, isAuthenticated, loading: authLoading } = useAuth();
    const { unreadByUser, markConversationAsRead, loadUnreadCounts, loadUnviewedQuizzes } = useMessages();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [waitingForAuth, setWaitingForAuth] = useState(false);
    const loginCanceledRef = useRef(false);
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [conversationShares, setConversationShares] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [conversationUsers, setConversationUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    const isFirstLoad = useRef(true);
    const prevItemsLength = useRef(0);

    const conversationItems = useMemo(() => {
        const mappedMessages = messages.map(msg => ({
            type: 'message',
            id: `message-${msg.id}`,
            created_at: msg.created_at,
            payload: msg,
        }));

        const mappedShares = conversationShares.map(share => ({
            type: 'share',
            id: `share-${share.id}`,
            created_at: share.created_at,
            payload: share,
        }));

        return [...mappedMessages, ...mappedShares].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
    }, [messages, conversationShares]);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
                behavior: 'instant',
                block: 'end'
            });
        }
    };

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
        const itemCount = conversationItems.length;

        if (isFirstLoad.current && itemCount > 0) {
            scrollToBottom();
            isFirstLoad.current = false;
            prevItemsLength.current = itemCount;
        } else if (itemCount > prevItemsLength.current) {
            // New items arrived, scroll instantly
            scrollToBottom();
            prevItemsLength.current = itemCount;
        }
    }, [conversationItems]);

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
            isFirstLoad.current = true;
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
            
            // Filter allUsers to only include users with conversations and sort by last message
            const usersWithConversations = allUsers
                .filter(u => userLastMessage[u.id])
                .sort((a, b) => userLastMessage[b.id] - userLastMessage[a.id]);
            
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
                const [messagesResponse, sharesResponse] = await Promise.all([
                    axios.get(`${API_BASE_URL}/messages/conversation/`, {
                        params,
                        withCredentials: true,
                    }),
                    axios.get(`${API_BASE_URL}/quiz-shares/`, {
                        withCredentials: true,
                    }),
                ]);

                setMessages(messagesResponse.data);

                const relevantShares = sharesResponse.data
                    .filter(share => (
                        (share.sender.id === user.id && share.recipient.id === userId) ||
                        (share.sender.id === userId && share.recipient.id === user.id)
                    ))
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                setConversationShares(relevantShares);
            } else {
                setMessages([]);
                setConversationShares([]);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const handleOpenSharedQuiz = async (share) => {
        if (!share?.quiz_data?.id) return;

        // Mark as viewed when the current user received it
        if (share.recipient.id === user.id && !share.is_viewed) {
            try {
                await axios.post(
                    `${API_BASE_URL}/quiz-shares/${share.id}/mark_viewed/`,
                    {},
                    { withCredentials: true }
                );
                setConversationShares(prev => prev.map(s =>
                    s.id === share.id ? { ...s, is_viewed: true } : s
                ));
                loadUnviewedQuizzes();
            } catch (error) {
                console.error('Error marking share as viewed:', error);
            }
        }

        navigate(`/quiz/${share.quiz_data.id}`);
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
            // Keep focus on input
            setTimeout(() => messageInputRef.current?.focus(), 50);
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
        prevItemsLength.current = 0;
        // Mark conversation as read when opened
        markConversationAsRead(selectedUserObj.id);
    };

    const handleInputFocus = () => {
        if (selectedUser) {
            // Mark conversation as read when user focuses on input
            markConversationAsRead(selectedUser.id);
        }
    };

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
                                ) : conversationItems.length === 0 ? (
                                    <div className="no-messages-area">
                                        <p>No messages yet. Start a conversation!</p>
                                    </div>
                                ) : (
                                    conversationItems.map(item => {
                                        if (item.type === 'message') {
                                            const msg = item.payload;
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`message ${msg.sender.id === user?.id ? 'message-sent' : 'message-received'}`}
                                                >
                                                    <div className="message-bubble">
                                                        <div className="message-content">{msg.content}</div>
                                                        <div className="message-time">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const share = item.payload;
                                        const isSender = share.sender.id === user?.id;
                                        return (
                                            <div
                                                key={item.id}
                                                className={`message ${isSender ? 'message-sent' : 'message-received'} share-message`}
                                            >
                                                <div className="message-bubble share-bubble">
                                                    <div className="share-header-row">
                                                        <div className="share-title">Quiz shared</div>
                                                        <div className="message-time">
                                                            {new Date(share.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div className="share-quiz-name">{share.quiz_data?.name}</div>
                                                    <div className="share-quiz-author">by {share.quiz_data?.author}</div>
                                                    {share.message && (
                                                        <div className="share-note">{share.message}</div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary share-open-btn"
                                                        onClick={() => handleOpenSharedQuiz(share)}
                                                    >
                                                        View quiz
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={sendMessage} className="message-input-form">
                                <input
                                    ref={messageInputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onFocus={handleInputFocus}
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

export default Messaging;
