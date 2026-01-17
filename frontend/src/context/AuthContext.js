import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

// Add CSRF token to requests
axios.interceptors.request.use((config) => {
    const token = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    if (token) {
        config.headers['X-CSRFToken'] = token;
    }
    return config;
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allUsers, setAllUsers] = useState([]);

    // Fetch current user on mount (ensure ordering)
    useEffect(() => {
        (async () => {
            await checkCurrentUser();
            await fetchAllUsers();
        })();
    }, []);

    const checkCurrentUser = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/auth/current-user/`);
            setUser(response.data.user);
        } catch (error) {
            console.error('Error checking current user:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/users/`);
            setAllUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const login = async (username, password) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
                username,
                password,
            });
            setUser(response.data.user);
            return { success: true, user: response.data.user };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.response?.data?.detail || 'Login failed',
            };
        }
    };

    const register = async (username, password) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register/`, {
                username,
                password,
            });
            setUser(response.data.user);
            return { success: true, user: response.data.user };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: error.response?.data?.detail || 'Registration failed',
            };
        }
    };

    const logout = async () => {
        try {
            // Get CSRF token from cookie
            const token = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
            
            await axios.post(`${API_BASE_URL}/auth/logout/`, {}, {
                headers: {
                    'X-CSRFToken': token || ''
                },
                withCredentials: true
            });
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear user on client side even if request fails
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        allUsers,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
