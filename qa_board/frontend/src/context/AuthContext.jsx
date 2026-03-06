import { createContext, useContext, useState, useCallback } from 'react';
import { apiFetch, getToken, getCurrentUser, initTheme } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    });

    useState(() => initTheme());

    const login = useCallback((newToken, newUser) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    }, []);

    const logout = useCallback(async () => {
        try { await apiFetch('/auth/logout/', { method: 'POST' }); } catch { }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }, []);

    const syncProfile = useCallback(async () => {
        if (!getToken()) return null;
        try {
            const profile = await apiFetch('/auth/profile/');
            localStorage.setItem('user', JSON.stringify(profile));
            setUser(profile);
            return profile;
        } catch { return null; }
    }, []);

    const updateUser = useCallback((newUser) => {
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    }, []);

    return (
        <AuthContext.Provider value={{ token, user, login, logout, syncProfile, updateUser, isLoggedIn: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
