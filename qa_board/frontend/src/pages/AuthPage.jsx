import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, showToast, toggleTheme } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
    const { isLoggedIn, login } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('login');
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    useEffect(() => {
        if (isLoggedIn) navigate('/dashboard');
    }, [isLoggedIn, navigate]);

    const handleTheme = () => {
        const next = toggleTheme();
        setTheme(next);
    };

    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [loginLoading, setLoginLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        try {
            const data = await apiFetch('/auth/login/', {
                method: 'POST',
                body: JSON.stringify({ email: loginData.email.trim(), password: loginData.password }),
            });
            login(data.token, data.user);
            showToast(`Ласкаво просимо, ${data.user.username}! 🐱`, 'success');
            setTimeout(() => navigate('/dashboard'), 600);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoginLoading(false);
        }
    };

    const [regData, setRegData] = useState({ username: '', email: '', password: '', password2: '' });
    const [regLoading, setRegLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (regData.password !== regData.password2) {
            showToast('Паролі не збігаються', 'error');
            return;
        }
        setRegLoading(true);
        try {
            const data = await apiFetch('/auth/register/', {
                method: 'POST',
                body: JSON.stringify({
                    username: regData.username.trim(),
                    email: regData.email.trim(),
                    password: regData.password,
                    password2: regData.password2,
                }),
            });
            login(data.token, data.user);
            showToast('Акаунт створено! 🎉', 'success');
            setTimeout(() => navigate('/dashboard'), 600);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setRegLoading(false);
        }
    };

    return (
        <div>
            <div style={{ position: 'fixed', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 100 }}>
                <button className="btn btn-outline btn-sm btn-theme-toggle"
                    style={{ background: 'var(--card-bg)', backdropFilter: 'blur(8px)' }}
                    title="Змінити тему" onClick={handleTheme}>
                    {theme === 'dark' ? '🌞' : '🌙'}
                </button>
            </div>

            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-logo">
                        <span className="auth-logo-icon">🐱</span>
                        <div className="auth-logo-title">PawMatch</div>
                        <div className="auth-logo-sub">Опитування на сумісність</div>
                    </div>

                    { }
                    <div className="auth-tabs">
                        <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Увійти</button>
                        <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Реєстрація</button>
                    </div>

                    { }
                    {tab === 'login' && (
                        <form onSubmit={handleLogin} autoComplete="off">
                            <div className="form-group">
                                <label className="form-label" htmlFor="login-email">Email</label>
                                <input className="form-control" type="email" id="login-email" placeholder="your@email.com" required
                                    value={loginData.email} onChange={e => setLoginData(d => ({ ...d, email: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="login-pass">Пароль</label>
                                <input className="form-control" type="password" id="login-pass" placeholder="••••••••" required
                                    value={loginData.password} onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full btn-lg mt-2" disabled={loginLoading}>
                                {loginLoading ? 'Вхід...' : '🐾 Увійти'}
                            </button>
                        </form>
                    )}

                    { }
                    {tab === 'register' && (
                        <form onSubmit={handleRegister} autoComplete="off">
                            <div className="form-group">
                                <label className="form-label">Ім'я користувача</label>
                                <input className="form-control" type="text" placeholder="cat_1" required
                                    value={regData.username} onChange={e => setRegData(d => ({ ...d, username: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-control" type="email" placeholder="your@email.com" required
                                    value={regData.email} onChange={e => setRegData(d => ({ ...d, email: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Пароль</label>
                                <input className="form-control" type="password" placeholder="мін. 8 символів" required
                                    value={regData.password} onChange={e => setRegData(d => ({ ...d, password: e.target.value }))} />
                                <div className="form-hint">Мінімум 8 символів</div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Повторіть пароль</label>
                                <input className="form-control" type="password" placeholder="••••••••" required
                                    value={regData.password2} onChange={e => setRegData(d => ({ ...d, password2: e.target.value }))} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full btn-lg mt-2" disabled={regLoading}>
                                {regLoading ? 'Реєстрація...' : '🐱 Зареєструватись'}
                            </button>
                        </form>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Проходячи реєстрацію, ви погоджуєтесь із правилами платформи 🐾
                    </div>
                </div>
            </div>
        </div>
    );
}
