import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Проверяем, есть ли токен при загрузке
        const token = localStorage.getItem('token');
        if (token) {
            setUser({ token });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await API.post('/login', { email, password });
            const { token } = response.data;
            localStorage.setItem('token', token);
            setUser({ token });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data || 'Login failed' };
        }
    };

    const register = async (email, password) => {
        try {
            await API.post('/register', { email, password });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};