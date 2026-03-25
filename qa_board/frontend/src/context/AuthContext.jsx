import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { apiFetch, getToken, getCurrentUser, initTheme } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    });

    useState(() => initTheme());

    const onlineWsRef = useRef(null);

    const connectOnlineWs = useCallback((tok) => {
        if (onlineWsRef.current) return;
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${proto}://${window.location.host}/ws/online/?token=${tok}`);
        ws.onclose = () => { onlineWsRef.current = null; };
        ws.onerror = () => { ws.close(); };
        onlineWsRef.current = ws;
    }, []);

    const disconnectOnlineWs = useCallback(() => {
        if (onlineWsRef.current) {
            onlineWsRef.current.close();
            onlineWsRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (token) {
            connectOnlineWs(token);
        } else {
            disconnectOnlineWs();
        }
        return () => {};
    }, [token]);

    const login = useCallback((newToken, newUser) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    }, []);

    const logout = useCallback(async () => {
        try { await apiFetch('/auth/logout/', { method: 'POST' }); } catch { }
        disconnectOnlineWs();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }, [disconnectOnlineWs]);

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
