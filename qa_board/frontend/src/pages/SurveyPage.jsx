import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { apiFetch, showToast } from '../api';
import { useAuth } from '../context/AuthContext';

export default function SurveyPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { syncProfile } = useAuth();
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        syncProfile();
        loadSurvey();
    }, [id]);

    async function loadSurvey() {
        setLoading(true);
        try {
            const data = await apiFetch(`/surveys/${id}/`);
            setSurvey(data);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    async function createSession() {
        setCreating(true);
        try {
            const session = await apiFetch('/sessions/', {
                method: 'POST',
                body: JSON.stringify({ survey_id: parseInt(id) }),
            });
            showToast('Сесію створено! 🎉', 'success');
            setTimeout(() => navigate(`/session/${session.id}`), 600);
        } catch (err) {
            showToast(err.message, 'error');
            setCreating(false);
        }
    }

    async function handleJoin(e) {
        e.preventDefault();
        const code = joinCode.trim().toUpperCase();
        if (!code) { showToast('Введіть код', 'error'); return; }
        setJoining(true);
        try {
            const data = await apiFetch('/sessions/join/', {
                method: 'POST',
                body: JSON.stringify({ session_code: code }),
            });
            showToast('Приєдналися! 🐱', 'success');
            setTimeout(() => navigate(`/session/${data.id}`), 600);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setJoining(false);
        }
    }

    if (loading) return (
        <div><Navbar backLink="/dashboard" />
            <div className="page-wrapper"><div className="loader"><div className="spinner" /><span>Завантаження...</span></div></div>
        </div>
    );

    return (
        <div>
            <Navbar backLink="/dashboard" />
            <div className="page-wrapper">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>

                    { }
                    <div>
                        <div className="mb-2">
                            <span className="badge">{survey?.category?.icon || '📋'} {survey?.category?.name}</span>
                        </div>
                        <h1 className="page-title">{survey?.title}</h1>
                        <p className="page-subtitle">{survey?.description}</p>
                        <div className="survey-meta mt-2 mb-3" style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            <span>❓ {survey?.questions?.length || 0} питань</span>
                            <span>👥 до {survey?.max_participants} учасників</span>
                        </div>

                        <div className="card">
                            <div className="card-title mb-2">📋 Питання опитування</div>
                            {survey?.questions?.length ? (
                                survey.questions.map((q, i) => (
                                    <div key={q.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--lavender-soft)' }}>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--lavender-mid)', fontWeight: 700, marginBottom: '0.2rem' }}>
                                            {i + 1}. {q.question_type === 'scale' ? '🔢 Шкала' : '☑️ Вибір'}
                                        </div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{q.text}</div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: 'var(--text-muted)' }}>Питання не завантажено</p>
                            )}
                        </div>
                    </div>

                    { }
                    <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚀</div>
                            <div className="card-title">Створити сесію</div>
                            <div className="card-body mb-2" style={{ fontSize: '0.85rem' }}>Стань організатором — запроси учасників за кодом</div>
                            <button className="btn btn-primary btn-full" onClick={createSession} disabled={creating}>
                                {creating ? 'Створення...' : '🚀 Створити сесію'}
                            </button>
                        </div>

                        <div className="join-box">
                            <h3>Вже є код?</h3>
                            <p>Приєднайтесь до існуючої сесії</p>
                            <form onSubmit={handleJoin}>
                                <div className="join-input-row">
                                    <input className="form-control" type="text" placeholder="ABC123" maxLength={8}
                                        style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, textAlign: 'center' }}
                                        value={joinCode} onChange={e => setJoinCode(e.target.value)} />
                                    <button type="submit" className="btn btn-secondary" disabled={joining}>→</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
