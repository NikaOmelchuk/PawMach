import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { apiFetch, showToast } from '../api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
    const { syncProfile } = useAuth();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [mySessions, setMySessions] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [loadingSurveys, setLoadingSurveys] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        syncProfile();
        loadCategories();
        loadSurveys(null);
        loadMySessions();
    }, []);

    async function loadMySessions() {
        try {
            const data = await apiFetch('/sessions/');
            setMySessions(data.results || data);
        } catch { }
    }

    async function loadCategories() {
        try {
            const data = await apiFetch('/categories/');
            setCategories(data.results || data);
        } catch { }
    }

    async function loadSurveys(categoryId) {
        setLoadingSurveys(true);
        try {
            const url = categoryId ? `/surveys/?category=${categoryId}` : '/surveys/';
            const data = await apiFetch(url);
            setSurveys(data.results || data);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoadingSurveys(false);
        }
    }

    function handleCategoryClick(id) {
        const catId = id || null;
        setActiveCategory(catId);
        loadSurveys(catId);
    }

    async function handleJoin(e) {
        e.preventDefault();
        const code = joinCode.trim().toUpperCase();
        if (!code) { showToast('Введіть код сесії', 'error'); return; }
        setJoining(true);
        try {
            const data = await apiFetch('/sessions/join/', {
                method: 'POST',
                body: JSON.stringify({ session_code: code }),
            });
            showToast(`Ви приєднались до сесії ${data.session_code}! 🎉`, 'success');
            setTimeout(() => navigate(`/session/${data.id}`), 800);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setJoining(false);
        }
    }

    return (
        <div>
            <Navbar activeLink="dashboard" />
            <div className="page-wrapper">
                { }
                <div className="page-header">
                    <h1 className="page-title">🐾 Опитування на сумісність</h1>
                    <p className="page-subtitle">Обери опитування, запроси друзів і дізнайся наскільки ви схожі</p>
                </div>

                { }
                <div className="join-box mb-3">
                    <h3>Маєш код сесії? 🔑</h3>
                    <p>Введи код щоб приєднатись до чужої сесії</p>
                    <form className="join-input-row" onSubmit={handleJoin}>
                        <input className="form-control" type="text" placeholder="ABC123" maxLength={8}
                            style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, textAlign: 'center' }}
                            value={joinCode} onChange={e => setJoinCode(e.target.value)} />
                        <button type="submit" className="btn btn-primary" disabled={joining}>
                            {joining ? '...' : '→ Приєднатись'}
                        </button>
                    </form>
                </div>

                {mySessions.length > 0 && (
                    <div className="mb-4">
                        <h2 className="section-title mb-2">Мої активні сессії 🚀</h2>
                        <div className="grid-3">
                            {mySessions.filter(s => s.status !== 'completed').map(s => (
                                <div key={s.id} className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--lavender-deep)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span className="badge badge-success">АКТИВНА</span>
                                        <span style={{ fontWeight: 800, color: 'var(--lavender-deep)', letterSpacing: '0.1em' }}>{s.session_code}</span>
                                    </div>
                                    <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{s.survey?.title}</div>
                                    <button className="btn btn-primary btn-sm btn-full" onClick={() => navigate(`/session/${s.id}`)}>
                                        Продовжити →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                { }
                <div className="filter-tabs">
                    <button className={`filter-tab${activeCategory === null ? ' active' : ''}`}
                        onClick={() => handleCategoryClick(null)}>Всі категорії</button>
                    {categories.map(cat => (
                        <button key={cat.id}
                            className={`filter-tab${activeCategory === cat.id ? ' active' : ''}`}
                            onClick={() => handleCategoryClick(cat.id)}>
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>

                { }
                <div className="grid-3">
                    {loadingSurveys ? (
                        <div className="loader" style={{ gridColumn: '1/-1' }}>
                            <div className="spinner" /><span>Завантаження...</span>
                        </div>
                    ) : surveys.length === 0 ? (
                        <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                            <span className="empty-state-icon">🐱</span>
                            <h3>Опитувань ще немає</h3>
                            <p>Адмін може додати їх через панель або API</p>
                        </div>
                    ) : surveys.map(s => (
                        <div key={s.id} className="card survey-card">
                            <div className="survey-card-header">
                                <span className="badge">{s.category?.icon || '📋'} {s.category?.name || ''}</span>
                                {!s.is_active && <span className="badge badge-warning">Неактивне</span>}
                            </div>
                            <div className="card-title">{s.title}</div>
                            <div className="card-body">{s.description || 'Без опису'}</div>
                            <div className="survey-card-footer">
                                <div className="survey-meta">
                                    <span>❓ {s.question_count} питань</span>
                                    <span>👥 до {s.max_participants}</span>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/survey/${s.id}`)}>
                                    Почати →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
