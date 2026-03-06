import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { apiFetch, showToast } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ResultsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { syncProfile } = useAuth();
    const [sessionTitle, setSessionTitle] = useState('Результати сумісності');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const scoreRefs = useRef({});

    useEffect(() => {
        syncProfile();
        loadResults();
    }, [id]);

    async function loadResults() {
        try {
            const [sess, res] = await Promise.all([
                apiFetch(`/sessions/${id}/`),
                apiFetch(`/sessions/${id}/results/`),
            ]);
            setSessionTitle(sess.survey?.title || 'Результати');
            setResults(res);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!results.length) return;
        results.forEach(r => animateScore(r.id, r.score));
    }, [results]);

    function animateScore(id, targetScore) {
        const scoreEl = document.getElementById(`score-${id}`);
        const barEl = document.getElementById(`bar-${id}`);
        const rounded = Math.round(targetScore);
        let current = 0;
        const step = Math.max(1, Math.floor(rounded / 60));
        const timer = setInterval(() => {
            current = Math.min(current + step, rounded);
            if (scoreEl) scoreEl.textContent = `${current}%`;
            if (barEl) barEl.style.width = `${current}%`;
            if (current >= rounded) clearInterval(timer);
        }, 16);
    }

    function getEmoji(score) {
        if (score >= 80) return '💜';
        if (score >= 60) return '🐱';
        if (score >= 40) return '😺';
        return '🙈';
    }

    function getLabel(score) {
        if (score >= 80) return 'Ідеальна пара!';
        if (score >= 60) return 'Дуже схожі!';
        if (score >= 40) return 'Є спільне';
        return 'Різні характери';
    }

    return (
        <div>
            <Navbar backLink="/dashboard" />
            <div className="page-wrapper">
                <div className="page-header text-center">
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💜</div>
                    <h1 className="page-title">{sessionTitle}</h1>
                    <p className="page-subtitle">Ось наскільки ви схожі між собою</p>
                </div>

                <div className="grid-2">
                    {loading ? (
                        <div className="loader" style={{ gridColumn: '1/-1' }}>
                            <div className="spinner" /><span>Рахуємо сумісність...</span>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                            <span className="empty-state-icon">🐱</span>
                            <h3>Результатів ще немає</h3>
                            <p>Сесія ще не завершена або відповідей замало</p>
                        </div>
                    ) : results.map(r => {
                        const scoreRounded = Math.round(r.score);
                        return (
                            <div key={r.id} className="card result-card">
                                <div className="compat-users">
                                    <div className="user-avatar" style={{ width: 40, height: 40 }}>{r.user1.username[0].toUpperCase()}</div>
                                    <span>{r.user1.username}</span>
                                    <span className="compat-heart">♥</span>
                                    <span>{r.user2.username}</span>
                                    <div className="user-avatar" style={{ width: 40, height: 40 }}>{r.user2.username[0].toUpperCase()}</div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <div className="compat-score" id={`score-${r.id}`}>0%</div>
                                    <span style={{ fontSize: '1.5rem' }}>{getEmoji(scoreRounded)}</span>
                                </div>
                                <div style={{ color: 'var(--text-light)', fontWeight: 600, marginBottom: '1rem' }}>{getLabel(scoreRounded)}</div>

                                <div className="progress-bar-wrap">
                                    <div className="progress-bar-fill" style={{ width: '0%' }} id={`bar-${r.id}`} />
                                </div>

                                {r.strengths?.length > 0 && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-mid)', marginBottom: '0.4rem' }}>💪 Спільне</div>
                                        <div className="tags-list">
                                            {r.strengths.map((s, i) => <span key={i} className="badge badge-success">{s}</span>)}
                                        </div>
                                    </div>
                                )}

                                {r.weaknesses?.length > 0 && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-mid)', marginBottom: '0.4rem' }}>🌱 Розбіжності</div>
                                        <div className="tags-list">
                                            {r.weaknesses.map((s, i) => <span key={i} className="badge badge-warning">{s}</span>)}
                                        </div>
                                    </div>
                                )}

                                {r.lifestyle_tags?.length > 0 && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-mid)', marginBottom: '0.4rem' }}>🏷️ Стиль життя</div>
                                        <div className="tags-list">
                                            {r.lifestyle_tags.map((s, i) => <span key={i} className="badge">{s}</span>)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="text-center mt-3">
                    <button className="btn btn-secondary btn-lg" onClick={() => navigate('/dashboard')}>🐾 Нове опитування</button>
                </div>
            </div>
        </div>
    );
}
