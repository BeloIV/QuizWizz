import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from './AuthContext';

const MessagesContext = createContext();

export const MessagesProvider = ({ children }) => {
    const { user, allUsers } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadByUser, setUnreadByUser] = useState({});
    const [unviewedQuizzesCount, setUnviewedQuizzesCount] = useState(0);

    useEffect(() => {
        if (user) {
            loadUnreadCounts();
            loadUnviewedQuizzes();
            
            // Poll for unread counts every 10 seconds
            const interval = setInterval(() => {
                loadUnreadCounts();
                loadUnviewedQuizzes();
            }, 10000);
            
            return () => clearInterval(interval);
        } else {
            setUnreadCount(0);
            setUnreadByUser({});
            setUnviewedQuizzesCount(0);
        }
    }, [user]);

    const loadUnreadCounts = async () => {
        if (!user) return;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/messages/`, {
                withCredentials: true,
            });
            
            // Count unread messages where current user is recipient
            const unreadMessages = response.data.filter(
                msg => msg.recipient.id === user.id && !msg.is_read
            );
            
            setUnreadCount(unreadMessages.length);
            
            // Group unread messages by sender
            const unreadBySender = {};
            unreadMessages.forEach(msg => {
                const senderId = msg.sender.id;
                unreadBySender[senderId] = (unreadBySender[senderId] || 0) + 1;
            });
            
            setUnreadByUser(unreadBySender);
        } catch (error) {
            console.error('Error loading unread counts:', error);
        }
    };

    const markConversationAsRead = async (userId) => {
        if (!user) return;
        
        try {
            // Get all messages in this conversation
            const response = await axios.get(`${API_BASE_URL}/messages/conversation/`, {
                params: { user_id: userId },
                withCredentials: true,
            });
            
            // Mark unread messages from this user as read
            const unreadMessages = response.data.filter(
                msg => msg.recipient.id === user.id && !msg.is_read
            );
            
            for (const msg of unreadMessages) {
                await axios.post(`${API_BASE_URL}/messages/${msg.id}/mark_read/`, {}, {
                    withCredentials: true,
                });
            }
            
            // Refresh counts
            loadUnreadCounts();
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const loadUnviewedQuizzes = async () => {
        if (!user) return;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/quiz-shares/received/`, {
                withCredentials: true,
            });
            
            // Count unviewed quiz shares
            const unviewedCount = response.data.filter(share => !share.is_viewed).length;
            setUnviewedQuizzesCount(unviewedCount);
        } catch (error) {
            console.error('Error loading unviewed quizzes:', error);
        }
    };

    const value = {
        unreadCount,
        unreadByUser,
        unviewedQuizzesCount,
        loadUnreadCounts,
        markConversationAsRead,
        loadUnviewedQuizzes,
    };

    return (
        <MessagesContext.Provider value={value}>
            {children}
        </MessagesContext.Provider>
    );
};

export const useMessages = () => {
    const context = useContext(MessagesContext);
    if (!context) {
        throw new Error('useMessages must be used within a MessagesProvider');
    }
    return context;
};

export default MessagesContext;
