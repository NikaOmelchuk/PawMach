import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toggleTheme, sharePage } from '../api';

const ADMIN_EMAIL = 'omelchuknika@gmail.com';

export default function Navbar({ title, backLink, activeLink }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.email === ADMIN_EMAIL;
    const [theme, setTheme] = useState(
        () => localStorage.getItem('theme') || 'light'
    );
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleTheme = () => {
        const next = toggleTheme();
        setTheme(next);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
        setMenuOpen(false);
    };

    const avatarEl = user?.avatar ? (
        <img src={user.avatar} className="user-avatar" style={{ objectFit: 'cover' }} title="Профіль" />
    ) : (
        <div className="user-avatar" title="Профіль">
            {(user?.username || 'U')[0].toUpperCase()}
        </div>
    );

    return (
        <nav className="navbar">
            { }
            <Link to="/dashboard" className="navbar-brand">
                <span className="brand-icon">🐱</span> PawMatch
            </Link>

            { }
            <ul className="navbar-nav navbar-nav-desktop">
                {backLink ? (
                    <li><Link to={backLink} className="nav-link">← Назад</Link></li>
                ) : (
                    <>
                        <li><Link to="/dashboard" className={`nav-link${activeLink === 'dashboard' ? ' active' : ''}`}>Опитування</Link></li>
                        {isAdmin && <li><Link to="/services" className={`nav-link${activeLink === 'services' ? ' active' : ''}`}>🛠️ Сервіси</Link></li>}
                        <li><Link to="/about" className={`nav-link${activeLink === 'about' ? ' active' : ''}`}>Про додаток</Link></li>
                        <li><Link to="/profile" className={`nav-link${activeLink === 'profile' ? ' active' : ''}`}>Мій профіль</Link></li>
                    </>
                )}
                <li>
                    <button className="btn btn-outline btn-sm" style={{ padding: '0.3rem 0.6rem', border: 'none' }}
                        title="Поділитись" onClick={sharePage}>🔗</button>
                </li>
                <li>
                    <button className="btn btn-outline btn-sm" style={{ padding: '0.3rem 0.6rem', border: 'none' }}
                        title="Змінити тему" onClick={handleTheme}>
                        {theme === 'dark' ? '🌞' : '🌙'}
                    </button>
                </li>
            </ul>

            { }
            <div className="navbar-user navbar-user-desktop">
                {title && (
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-mid)', marginRight: '1rem' }}>
                        {title}
                    </div>
                )}
                <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, color: 'inherit' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-mid)', fontWeight: 600 }}>{user?.username}</span>
                    {avatarEl}
                </Link>
                <button className="btn btn-outline btn-sm" style={{ marginLeft: 15 }} onClick={handleLogout}>
                    Вийти
                </button>
            </div>

            { }
            <div className="navbar-mobile-controls">
                <button className="btn btn-outline btn-sm" style={{ padding: '0.3rem 0.6rem', border: 'none' }}
                    title="Поділитись" onClick={sharePage}>🔗</button>
                <button className="btn btn-outline btn-sm" style={{ padding: '0.3rem 0.6rem', border: 'none' }}
                    title="Змінити тему" onClick={handleTheme}>
                    {theme === 'dark' ? '🌞' : '🌙'}
                </button>
                <Link to="/profile" style={{ textDecoration: 'none' }}>
                    {avatarEl}
                </Link>
                <button
                    className="btn btn-outline btn-sm navbar-burger"
                    onClick={() => setMenuOpen(o => !o)}
                    aria-label="Меню"
                >
                    {menuOpen ? '✕' : '☰'}
                </button>
            </div>

            { }
            {menuOpen && (
                <div className="navbar-mobile-menu">
                    {backLink ? (
                        <Link to={backLink} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>← Назад</Link>
                    ) : (
                        <>
                            <Link to="/dashboard" className={`mobile-nav-link${activeLink === 'dashboard' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>🗳️ Опитування</Link>
                            {isAdmin && <Link to="/services" className={`mobile-nav-link${activeLink === 'services' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>🛠️ Сервіси</Link>}
                            <Link to="/about" className={`mobile-nav-link${activeLink === 'about' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>🐱 Про додаток</Link>
                            <Link to="/profile" className={`mobile-nav-link${activeLink === 'profile' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>👤 Мій профіль</Link>
                        </>
                    )}
                    <button className="mobile-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                        onClick={() => { sharePage(); setMenuOpen(false); }}>🔗 Поділитись</button>
                    <div style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', borderTop: '1px solid var(--lavender-border)' }}>
                        👤 {user?.username}
                    </div>
                    <button className="mobile-nav-link" style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                        onClick={handleLogout}>🚪 Вийти</button>
                </div>
            )}
        </nav>
    );
}
