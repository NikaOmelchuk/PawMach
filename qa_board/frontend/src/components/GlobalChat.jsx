import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getToken, showToast, getCurrentUser } from '../api';

export default function GlobalChat() {
    const location = useLocation();

    const match = location.pathname.match(/^\/(?:session|results)\/([^/]+)/);
    const id = match ? match[1] : null;

    const currentUser = getCurrentUser();

    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [unread, setUnread] = useState(0);
    const wsRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (!id) {
            setChatOpen(false);
            setMessages([]);
            setUnread(0);
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            return;
        }

        if (wsRef.current && wsRef.current.url.includes(`/ws/chat/${id}/`)) {
            return;
        }

        if (wsRef.current) {
            wsRef.current.close();
        }

        const token = getToken();
        if (!token) return;

        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${proto}://${window.location.host}/ws/chat/${id}/?token=${token}`);
        wsRef.current = ws;

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'survey_progress') {
                window.dispatchEvent(new CustomEvent('reloadSession'));
                showToast(data.message, 'info');
                return;
            }
            setMessages(prev => [...prev, data]);
            setUnread(c => (document.visibilityState === 'hidden' || !chatOpen) ? c + 1 : 0);
        };

        ws.onerror = () => { };
        ws.onclose = () => { };

        return () => { };
    }, [id]);

    useEffect(() => {
        if (chatOpen) {
            setUnread(0);
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatOpen, messages]);

    if (!id) return null;

    function sendMsg() {
        const msg = input.trim();
        if (!msg || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ message: msg }));
        setInput('');
    }

    function handleKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMsg();
        }
    }

    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            {chatOpen && (
                <div style={{
                    width: 320, height: 420, background: 'var(--card-bg, #fff)', borderRadius: 16,
                    boxShadow: '0 8px 32px rgba(124,58,237,0.18)', display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', border: '1px solid rgba(124,58,237,0.15)'
                }}>
                    <div style={{ padding: '0.75rem 1rem', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        💬 Чат сесії
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {messages.map((msg, i) => {
                            const isOwn = msg.username === currentUser?.username;
                            const isSystem = msg.is_system;
                            return (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isSystem ? 'center' : isOwn ? 'flex-end' : 'flex-start' }}>
                                    {isSystem ? (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2px 8px', background: 'rgba(124,58,237,0.07)', borderRadius: 8 }}>
                                            {msg.message}
                                        </span>
                                    ) : (
                                        <>
                                            {!isOwn && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>{msg.username}</span>}
                                            <div style={{
                                                maxWidth: '80%', padding: '0.4rem 0.75rem', borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                                background: isOwn ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' : 'var(--lavender-soft,#ede9fe)',
                                                color: isOwn ? '#fff' : 'var(--text-dark)', fontSize: '0.85rem', wordBreak: 'break-word'
                                            }}>
                                                {msg.message}
                                            </div>
                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{msg.timestamp}</span>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>
                    <div style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(124,58,237,0.1)', background: 'var(--card-bg,#fff)' }}>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Написати повідомлення..."
                            style={{ flex: 1, padding: '0.4rem 0.75rem', borderRadius: 10, border: '1px solid rgba(124,58,237,0.25)', fontSize: '0.85rem', background: 'var(--input-bg,#f5f3ff)', color: 'var(--text-dark)', outline: 'none' }}
                        />
                        <button onClick={sendMsg} style={{ padding: '0.4rem 0.75rem', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                            ➤
                        </button>
                    </div>
                </div>
            )}
            <button
                onClick={() => setChatOpen(o => !o)}
                style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1.4rem', boxShadow: '0 4px 16px rgba(124,58,237,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
            >
                💬
                {unread > 0 && !chatOpen && (
                    <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>
        </div>
    );
}
