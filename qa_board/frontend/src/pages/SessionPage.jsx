import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { apiFetch, showToast, getCurrentUser, getMediaUrl, getToken } from '../api';
import { useAuth } from '../context/AuthContext';

export default function SessionPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { syncProfile } = useAuth();

    const [session, setSession] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentQ, setCurrentQ] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [completing, setCompleting] = useState(false);

    useEffect(() => {
        syncProfile();
        loadSession();
        const interval = setInterval(loadSession, 3000);
        window.addEventListener('reloadSession', loadSession);
        return () => {
            clearInterval(interval);
            window.removeEventListener('reloadSession', loadSession);
        };
    }, [id]);

    async function loadSession() {
        try {
            const sess = await apiFetch(`/sessions/${id}/`);
            if (sess.status === 'completed') {
                navigate(`/results/${id}`);
                return;
            }
            setSession(sess);
            if (sess.has_submitted) setSubmitted(true);
            const survey = await apiFetch(`/surveys/${sess.survey.id}/`);
            setQuestions(survey.questions || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function handleAnswer(qId, value) {
        setAnswers(prev => ({ ...prev, [qId]: value }));
    }

    function navigate_q(dir) {
        setCurrentQ(prev => Math.max(0, Math.min(questions.length - 1, prev + dir)));
    }

    async function submitAnswers() {
        const payload = Object.values(answers);
        if (!payload.length) { showToast('Дайте хоча б одну відповідь', 'error'); return; }
        setSubmitting(true);
        try {
            const res = await apiFetch(`/sessions/${id}/submit/`, {
                method: 'POST',
                body: JSON.stringify({ answers: payload }),
            });
            showToast(`Збережено ${res.saved} відповідей! ✅`, 'success');
            setSubmitted(true);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    async function completeSession() {
        setCompleting(true);
        try {
            await apiFetch(`/sessions/${id}/complete/`, { method: 'POST' });
            showToast('Сесію завершено! Рахуємо сумісність... 🐱', 'success');
            setTimeout(() => navigate(`/results/${id}`), 1200);
        } catch (err) {
            showToast(err.message, 'error');
            setCompleting(false);
        }
    }

    function copyCode() {
        if (session?.session_code) {
            navigator.clipboard.writeText(session.session_code);
            showToast('Код скопійовано! 📋', 'info');
        }
    }

    if (loading) return (
        <div><Navbar />
            <div className="page-wrapper"><div className="loader"><div className="spinner" /><span>Завантаження...</span></div></div>
        </div>
    );

    const currentUser = getCurrentUser();
    const isOwner = session?.created_by?.id === currentUser?.id;
    const q = questions[currentQ];
    const total = questions.length;
    const progress = total ? ((currentQ + 1) / total) * 100 : 0;
    const isLast = currentQ === total - 1;

    return (
        <div>
            <Navbar title={session?.survey?.title} />
            <div className="page-wrapper session-layout">

                <div className="session-main-col">
                    <div className="session-code-mobile-top">
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>КОД СЕСІЇ</span>
                        <div className="session-code-display session-code-sm" title="Клікни щоб скопіювати" onClick={copyCode} style={{ cursor: 'pointer', fontSize: '1.2rem', padding: '0.3rem 0.9rem', margin: '0.3rem 0 0.15rem' }}>
                            {session?.session_code || '—'}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--lavender-mid)' }}>Прогрес</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{currentQ + 1} / {total}</span>
                    </div>
                    <div className="progress-bar-wrap">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>

                    {q && (
                        <div className="card" style={{ marginTop: '1rem' }}>
                            <div className="question-number">Питання {currentQ + 1}</div>
                            <div className="question-text">{q.text}</div>

                            {q.question_type === 'scale' ? (
                                <ScaleQuestion
                                    q={q}
                                    value={answers[q.id]?.scale_value ?? 5}
                                    onChange={val => handleAnswer(q.id, { question_id: q.id, scale_value: val })}
                                />
                            ) : (
                                <ChoiceQuestion
                                    q={q}
                                    selected={answers[q.id]?.selected_option_id}
                                    onChange={optId => handleAnswer(q.id, { question_id: q.id, selected_option_id: optId })}
                                />
                            )}

                            {!submitted && (
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                    <button className="btn btn-outline" onClick={() => navigate_q(-1)} disabled={currentQ === 0}>← Назад</button>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        {!isLast && <button className="btn btn-primary" onClick={() => navigate_q(1)}>Далі →</button>}
                                        {isLast && (
                                            <button className="btn btn-primary" onClick={submitAnswers} disabled={submitting}>
                                                {submitting ? 'Відправка...' : '✅ Надіслати відповіді'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {submitted && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--lavender-soft)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--lavender-deep)', fontWeight: 700 }}>
                                    🎉 Відповіді надіслано! Чекай поки всі учасники завершать.
                                </div>
                            )}
                        </div>
                    )}

                    {isOwner && session?.status !== 'completed' && (
                        <div className="mt-3">
                            <div className="card" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(167,139,250,0.12))', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🏁</div>
                                <div className="card-title mb-1">Всі відповіли?</div>
                                <div className="card-body mb-2" style={{ fontSize: '0.875rem' }}>Завершіть сесію щоб побачити результати сумісності</div>
                                <button className="btn btn-primary btn-full" onClick={completeSession} disabled={completing}>
                                    {completing ? 'Завершення...' : '🏁 Завершити та побачити результати'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="session-sidebar">
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>КОД СЕСІЇ</div>
                        <div className="session-code-display" title="Клікни щоб скопіювати" onClick={copyCode} style={{ cursor: 'pointer' }}>
                            {session?.session_code || '—'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Поділись з учасниками</div>
                    </div>

                    <div className="card">
                        <div className="card-title mb-2">👥 Учасники</div>
                        {session?.participants?.map(p => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0' }}>
                                <div style={{ position: 'relative' }}>
                                    {p.avatar ? (
                                        <img src={getMediaUrl(p.avatar)} alt="avatar" className="user-avatar" style={{ width: 28, height: 28, objectFit: 'cover' }} />
                                    ) : (
                                        <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                                            {p.username[0].toUpperCase()}
                                        </div>
                                    )}
                                    {p.is_online && (
                                        <div style={{
                                            position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
                                            borderRadius: '50%', backgroundColor: '#10B981', border: '2px solid var(--card-bg)',
                                            boxShadow: '0 0 4px rgba(16,185,129,0.5)'
                                        }} title="В мережі" />
                                    )}
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: p.is_online ? 'var(--text-dark)' : 'var(--text-mid)' }}>{p.username}</span>
                                {session?.submitted_users?.includes(p.username) && <span title="Відповів" style={{ fontSize: '0.85rem' }}>✅</span>}
                                {p.id === session.created_by?.id && <span className="badge" style={{ fontSize: '0.65rem' }}>Орг.</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}



function ScaleQuestion({ q, value, onChange }) {
    return (
        <div className="scale-wrap">
            <div className="scale-value-display">{value}</div>
            <input type="range" min="1" max="10" value={value}
                onChange={e => onChange(parseInt(e.target.value))} />
            <div className="scale-labels"><span>1 — Зовсім ні</span><span>10 — Повністю так</span></div>
        </div>
    );
}

function ChoiceQuestion({ q, selected, onChange }) {
    return (
        <div className="options-grid">
            {(q.options || []).map(opt => (
                <button key={opt.id}
                    className={`option-btn${selected === opt.id ? ' selected' : ''}`}
                    onClick={() => onChange(opt.id)}>
                    {opt.text}
                </button>
            ))}
        </div>
    );
}

