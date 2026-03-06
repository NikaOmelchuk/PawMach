import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { apiFetch, showToast } from '../api';
import { useAuth } from '../context/AuthContext';

const unwrap = (data) => (Array.isArray(data) ? data : (data?.results ?? []));

const TABS = [
    { key: 'chat', label: '💬 Чат' },
    { key: 'articles', label: '📰 Коментарі' },
    { key: 'announcements', label: '📢 Оголошення' },
    { key: 'qna', label: '❓ Q&A' },
    { key: 'todo', label: '✅ To-Do' },
    { key: 'timers', label: '⏱ Таймер' },
    { key: 'polls', label: '🗳️ Голосування' },
    { key: 'scores', label: '🏆 Лідерборд' },
    { key: 'quizzes', label: '💡 Вікторина' },
];

export default function LabServicesPage() {
    const [activeTab, setActiveTab] = useState('chat');
    const { user } = useAuth();

    return (
        <div>
            <Navbar activeLink="services" />
            <div className="page-wrapper">
                <div className="page-header">
                    <h1 className="page-title">🛠️ Лабораторні сервіси</h1>
                    <p className="page-subtitle">Всі сервіси в одному місці</p>
                </div>

                {}
                <div className="filter-tabs" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            className={`filter-tab${activeTab === t.key ? ' active' : ''}`}
                            onClick={() => setActiveTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {}
                {activeTab === 'chat' && <ChatSection />}
                {activeTab === 'articles' && <ArticlesSection />}
                {activeTab === 'announcements' && <AnnouncementsSection />}
                {activeTab === 'qna' && <QnaSection />}
                {activeTab === 'todo' && <TodoSection userId={user?.id} />}
                {activeTab === 'timers' && <TimersSection />}
                {activeTab === 'polls' && <PollsSection />}
                {activeTab === 'scores' && <ScoresSection />}
                {activeTab === 'quizzes' && <QuizzesSection />}
            </div>
        </div>
    );
}

function ChatSection() {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const { user } = useAuth();

    const load = useCallback(async () => {
        try { setMessages(unwrap(await apiFetch('/lab/chat/'))); } catch { }
    }, []);

    useEffect(() => { load(); }, [load]);

    const send = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        try {
            await apiFetch('/lab/chat/', { method: 'POST', body: JSON.stringify({ content: text }) });
            setText('');
            load();
        } catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <div className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
            <div className="card-title">💬 Загальний чат</div>
            <div style={{ maxHeight: 400, overflowY: 'auto', padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {messages.length === 0 && <div className="empty-state"><span className="empty-state-icon">💬</span><p>Повідомлень ще немає. Напишіть першим!</p></div>}
                {messages.map(m => (
                    <div key={m.id} style={{
                        background: m.author_id === user?.id ? 'var(--accent)' : 'var(--card-bg)',
                        color: m.author_id === user?.id ? '#fff' : 'var(--text)',
                        alignSelf: m.author_id === user?.id ? 'flex-end' : 'flex-start',
                        padding: '0.5rem 1rem', borderRadius: 16, maxWidth: '80%',
                    }}>
                        {m.content}
                        <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: 2 }}>{new Date(m.created_at).toLocaleTimeString()}</div>
                    </div>
                ))}
            </div>
            <form onSubmit={send} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <input className="form-control" value={text} onChange={e => setText(e.target.value)} placeholder="Напишіть повідомлення..." style={{ flex: 1 }} />
                <button type="submit" className="btn btn-primary">Надіслати</button>
            </form>
        </div>
    );
}

function ArticlesSection() {
    const [articles, setArticles] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');

    useEffect(() => { apiFetch('/lab/articles/').then(d => setArticles(unwrap(d))).catch(() => { }); }, []);

    const loadComments = async (art) => {
        setSelectedArticle(art);
        try { setComments(unwrap(await apiFetch(`/lab/comments/?article=${art.id}`))); } catch { }
    };

    const createArticle = async (e) => {
        e.preventDefault();
        try {
            await apiFetch('/lab/articles/', { method: 'POST', body: JSON.stringify({ title, content }) });
            setTitle(''); setContent('');
            const fresh = unwrap(await apiFetch('/lab/articles/'));
            setArticles(fresh);
            showToast('Статтю створено!', 'success');
        } catch (err) { showToast(err.message, 'error'); }
    };

    const addComment = async (e) => {
        e.preventDefault();
        try {
            await apiFetch('/lab/comments/', { method: 'POST', body: JSON.stringify({ article: selectedArticle.id, text: commentText }) });
            setCommentText('');
            loadComments(selectedArticle);
        } catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
                <div className="card">
                    <div className="card-title">📝 Нова стаття</div>
                    <form onSubmit={createArticle} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input className="form-control" placeholder="Заголовок" value={title} onChange={e => setTitle(e.target.value)} required />
                        <textarea className="form-control" placeholder="Текст статті" value={content} onChange={e => setContent(e.target.value)} rows={4} required />
                        <button type="submit" className="btn btn-primary">Опублікувати</button>
                    </form>
                </div>
                <div className="card" style={{ marginTop: '1rem' }}>
                    <div className="card-title">📰 Статті</div>
                    {articles.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Статей ще немає</p>}
                    {articles.map(a => (
                        <div key={a.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                            <strong>{a.title}</strong>
                            <br /><small style={{ color: 'var(--text-muted)' }}>{a.content?.slice(0, 80)}...</small>
                            <br /><button className="btn btn-sm btn-outline" style={{ marginTop: 4 }} onClick={() => loadComments(a)}>Коментарі ({a.comments?.length ?? 0})</button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="card">
                <div className="card-title">💬 {selectedArticle ? `Коментарі: ${selectedArticle.title}` : 'Оберіть статтю'}</div>
                {selectedArticle ? (
                    <>
                        {comments.map(c => <div key={c.id} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>{c.text}</div>)}
                        {comments.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Коментарів ще немає</p>}
                        <form onSubmit={addComment} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <input className="form-control" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Ваш коментар..." style={{ flex: 1 }} />
                            <button type="submit" className="btn btn-primary">→</button>
                        </form>
                    </>
                ) : <p style={{ color: 'var(--text-muted)' }}>Натисніть "Коментарі" на статті поруч</p>}
            </div>
        </div>
    );
}

function AnnouncementsSection() {
    const [items, setItems] = useState([]);

    const load = useCallback(async () => {
        try { setItems(unwrap(await apiFetch('/lab/announcements/'))); } catch { }
    }, []);

    useEffect(() => { load(); }, [load]);

    const react = async (id, type) => {
        try {
            await apiFetch(`/lab/announcements/${id}/react/`, { method: 'POST', body: JSON.stringify({ reaction_type: type }) });
            load();
        } catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.length === 0 && <div className="empty-state"><span className="empty-state-icon">📢</span><p>Оголошень ще немає. Адмін може додати їх через панель /admin/</p></div>}
            {items.map(a => (
                <div key={a.id} className="card">
                    <div className="card-title">📢 {a.title}</div>
                    <div className="card-body">{a.content}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        {['👍', '❤️', '😮', '😂'].map(emoji => (
                            <button key={emoji} className="btn btn-sm btn-outline" onClick={() => react(a.id, emoji)}>{emoji} {a.reactions_count > 0 && a.reactions_count}</button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function QnaSection() {
    const [questions, setQuestions] = useState([]);
    const [qTitle, setQTitle] = useState('');
    const [qContent, setQContent] = useState('');
    const [selected, setSelected] = useState(null);
    const [answerText, setAnswerText] = useState('');

    const load = useCallback(async () => {
        try { setQuestions(unwrap(await apiFetch('/lab/qna/questions/'))); } catch { }
    }, []);

    useEffect(() => { load(); }, [load]);

    const createQ = async (e) => {
        e.preventDefault();
        try {
            await apiFetch('/lab/qna/questions/', { method: 'POST', body: JSON.stringify({ title: qTitle, content: qContent }) });
            setQTitle(''); setQContent(''); load();
        } catch (err) { showToast(err.message, 'error'); }
    };

    const createA = async (e) => {
        e.preventDefault();
        try {
            await apiFetch('/lab/qna/answers/', { method: 'POST', body: JSON.stringify({ question: selected.id, content: answerText }) });
            setAnswerText('');
            const fresh = unwrap(await apiFetch('/lab/qna/questions/'));
            setQuestions(fresh);
            setSelected(fresh.find(q => q.id === selected.id));
        } catch (err) { showToast(err.message, 'error'); }
    };

    const vote = async (id, dir) => {
        try {
            await apiFetch(`/lab/qna/answers/${id}/${dir}/`, { method: 'POST' });
            const fresh = unwrap(await apiFetch('/lab/qna/questions/'));
            setQuestions(fresh);
            if (selected) setSelected(fresh.find(q => q.id === selected.id));
        } catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
                <div className="card">
                    <div className="card-title">❓ Нове питання</div>
                    <form onSubmit={createQ} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input className="form-control" placeholder="Заголовок питання" value={qTitle} onChange={e => setQTitle(e.target.value)} required />
                        <textarea className="form-control" placeholder="Деталі питання..." value={qContent} onChange={e => setQContent(e.target.value)} rows={3} />
                        <button type="submit" className="btn btn-primary">Задати питання</button>
                    </form>
                </div>
                <div className="card" style={{ marginTop: '1rem' }}>
                    <div className="card-title">❓ Питання</div>
                    {questions.map(q => (
                        <div key={q.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setSelected(q)}>
                            <strong>{q.title}</strong>
                            <br /><small style={{ color: 'var(--text-muted)' }}>{q.answers?.length ?? 0} відповідей</small>
                        </div>
                    ))}
                </div>
            </div>
            <div className="card">
                <div className="card-title">{selected ? selected.title : 'Оберіть питання'}</div>
                {selected && (
                    <>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selected.content}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0' }}>
                            {selected.answers?.map(a => (
                                <div key={a.id} className="card" style={{ padding: '0.75rem' }}>
                                    <div>{a.content}</div>
                                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem', alignItems: 'center' }}>
                                        <button className="btn btn-sm btn-outline" onClick={() => vote(a.id, 'upvote')}>▲</button>
                                        <strong>{a.rating}</strong>
                                        <button className="btn btn-sm btn-outline" onClick={() => vote(a.id, 'downvote')}>▼</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={createA} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input className="form-control" placeholder="Ваша відповідь..." value={answerText} onChange={e => setAnswerText(e.target.value)} style={{ flex: 1 }} />
                            <button type="submit" className="btn btn-primary">→</button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

function TodoSection() {
    const [tasks, setTasks] = useState([]);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');

    const load = useCallback(async () => {
        try { setTasks(unwrap(await apiFetch('/lab/todo/'))); } catch { }
    }, []);

    useEffect(() => { load(); }, [load]);

    const create = async (e) => {
        e.preventDefault();
        try {
            await apiFetch('/lab/todo/', { method: 'POST', body: JSON.stringify({ title: taskTitle, description: taskDesc }) });
            setTaskTitle(''); setTaskDesc(''); load();
        } catch (err) { showToast(err.message, 'error'); }
    };

    const toggle = async (task) => {
        try {
            await apiFetch(`/lab/todo/${task.id}/`, { method: 'PATCH', body: JSON.stringify({ is_completed: !task.is_completed }) });
            load();
        } catch (err) { showToast(err.message, 'error'); }
    };

    const remove = async (id) => {
        try { await apiFetch(`/lab/todo/${id}/`, { method: 'DELETE' }); load(); } catch { }
    };

    return (
        <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="card-title">✅ Список справ</div>
            <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <input className="form-control" placeholder="Назва завдання" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required />
                <textarea className="form-control" placeholder="Опис (необов'язково)" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} rows={2} />
                <button type="submit" className="btn btn-primary">+ Додати</button>
            </form>
            {tasks.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Завдань ще немає!</p>}
            {tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <input type="checkbox" checked={t.is_completed} onChange={() => toggle(t)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    <div style={{ flex: 1, textDecoration: t.is_completed ? 'line-through' : 'none', color: t.is_completed ? 'var(--text-muted)' : 'var(--text)' }}>
                        <strong>{t.title}</strong>
                        {t.description && <div style={{ fontSize: '0.8rem' }}>{t.description}</div>}
                    </div>
                    <button className="btn btn-sm btn-outline" onClick={() => remove(t.id)}>🗑</button>
                </div>
            ))}
        </div>
    );
}

function TimersSection() {
    const [timers, setTimers] = useState([]);
    const [title, setTitle] = useState('');
    const [seconds, setSeconds] = useState(60);
    const [, setTick] = useState(0);

    useEffect(() => {
        apiFetch('/lab/timers/').then(d => setTimers(unwrap(d))).catch(() => { });
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const create = async (e) => {
        e.preventDefault();
        try {
            const t = await apiFetch('/lab/timers/', { method: 'POST', body: JSON.stringify({ title, duration_seconds: Number(seconds) }) });
            setTimers(prev => [t, ...prev]);
            setTitle('');
        } catch (err) { showToast(err.message, 'error'); }
    };

    const remove = async (id) => {
        try { await apiFetch(`/lab/timers/${id}/`, { method: 'DELETE' }); setTimers(ts => ts.filter(t => t.id !== id)); } catch { }
    };

    const remaining = (t) => {
        const elapsed = (Date.now() - new Date(t.started_at).getTime()) / 1000;
        return Math.max(0, t.duration_seconds - Math.floor(elapsed));
    };

    const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="card-title">⏱ Таймери зворотного відліку</div>
            <form onSubmit={create} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <input className="form-control" placeholder="Назва таймера" value={title} onChange={e => setTitle(e.target.value)} required style={{ flex: 2, minWidth: 150 }} />
                <input className="form-control" type="number" min={1} value={seconds} onChange={e => setSeconds(e.target.value)} placeholder="Секунд" style={{ flex: 1, minWidth: 80 }} />
                <button type="submit" className="btn btn-primary">▶ Старт</button>
            </form>
            {timers.map(t => {
                const left = remaining(t);
                const pct = (1 - left / t.duration_seconds) * 100;
                return (
                    <div key={t.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>{t.title}</strong>
                            <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: left === 0 ? 'var(--danger)' : 'var(--accent)' }}>
                                {left === 0 ? '⏰ Час!' : fmt(left)}
                            </span>
                            <button className="btn btn-sm btn-outline" onClick={() => remove(t.id)}>🗑</button>
                        </div>
                        <div style={{ background: 'var(--border)', borderRadius: 8, height: 6, marginTop: 6 }}>
                            <div style={{ background: left === 0 ? 'var(--danger)' : 'var(--accent)', width: `${pct}%`, height: '100%', borderRadius: 8, transition: 'width 1s linear' }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function PollsSection() {
    const [polls, setPolls] = useState([]);
    const [pollTitle, setPollTitle] = useState('');
    const [opts, setOpts] = useState(['', '']);

    const load = useCallback(async () => {
        try { setPolls(unwrap(await apiFetch('/lab/polls/'))); } catch { }
    }, []);

    useEffect(() => { load(); }, [load]);

    const create = async (e) => {
        e.preventDefault();
        try {
            const poll = await apiFetch('/lab/polls/', { method: 'POST', body: JSON.stringify({ title: pollTitle }) });
            await Promise.all(opts.filter(o => o.trim()).map(o =>
                apiFetch('/lab/polls/options/', { method: 'POST', body: JSON.stringify({ poll: poll.id, text: o }) })
            ));
            setPollTitle(''); setOpts(['', '']); load();
            showToast('Голосування створено!', 'success');
        } catch (err) { showToast(err.message, 'error'); }
    };

    const vote = async (optionId) => {
        try {
            await apiFetch(`/lab/polls/options/${optionId}/vote/`, { method: 'POST' });
            load();
            showToast('Голос зараховано! 🗳️', 'success');
        } catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
                <div className="card-title">🗳️ Нове голосування</div>
                <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input className="form-control" placeholder="Питання голосування" value={pollTitle} onChange={e => setPollTitle(e.target.value)} required />
                    {opts.map((o, i) => (
                        <input key={i} className="form-control" placeholder={`Варіант ${i + 1}`} value={o} onChange={e => { const n = [...opts]; n[i] = e.target.value; setOpts(n); }} />
                    ))}
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpts([...opts, ''])}>+ Додати варіант</button>
                    <button type="submit" className="btn btn-primary">Опублікувати</button>
                </form>
            </div>
            {polls.map(p => {
                const total = p.total_votes || 0;
                return (
                    <div key={p.id} className="card">
                        <div className="card-title">🗳️ {p.title}</div>
                        {p.options?.map(o => {
                            const pct = total === 0 ? 0 : Math.round((o.votes_count / total) * 100);
                            return (
                                <div key={o.id} style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                        <span>{o.text}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{o.votes_count} ({pct}%)</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <div style={{ flex: 1, background: 'var(--border)', borderRadius: 8, height: 8 }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 8 }} />
                                        </div>
                                        <button className="btn btn-sm btn-primary" onClick={() => vote(o.id)}>Обрати</button>
                                    </div>
                                </div>
                            );
                        })}
                        <small style={{ color: 'var(--text-muted)' }}>Всього голосів: {total}</small>
                    </div>
                );
            })}
        </div>
    );
}

function ScoresSection() {
    const [scores, setScores] = useState([]);
    const [points, setPoints] = useState(10);
    const { user } = useAuth();

    const load = useCallback(async () => {
        try { setScores(unwrap(await apiFetch('/lab/scores/'))); } catch { }
    }, []);

    useEffect(() => { load(); }, [load]);

    const addPoints = async (e) => {
        e.preventDefault();
        try {
            await apiFetch('/lab/scores/add_points/', { method: 'POST', body: JSON.stringify({ points: Number(points) }) });
            load();
            showToast(`+${points} балів!`, 'success');
        } catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="card-title">🏆 Лідерборд</div>
            <form onSubmit={addPoints} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input className="form-control" type="number" min={1} value={points} onChange={e => setPoints(e.target.value)} style={{ width: 100 }} />
                <button type="submit" className="btn btn-primary">+ Додати собі балів</button>
            </form>
            {scores.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Рейтинг ще порожній</p>}
            {scores.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, width: 30, textAlign: 'center', color: i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? '#cd7f32' : 'var(--text-muted)' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </div>
                    <div style={{ flex: 1 }}>
                        <strong>User #{s.user_id}</strong>
                        {s.user_id === user?.id && <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}> (це ви)</span>}
                    </div>
                    <strong style={{ fontSize: '1.1rem' }}>{s.score} балів</strong>
                </div>
            ))}
        </div>
    );
}

function QuizzesSection() {
    const [quizzes, setQuizzes] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);

    useEffect(() => { apiFetch('/lab/quizzes/').then(d => setQuizzes(unwrap(d))).catch(() => { }); }, []);

    const selectChoice = (questionId, choiceId) => {
        setAnswers(prev => ({ ...prev, [questionId]: choiceId }));
    };

    const submit = async () => {
        const payload = Object.entries(answers).map(([question_id, choice_id]) => ({ question_id: Number(question_id), choice_id: Number(choice_id) }));
        try {
            const res = await apiFetch(`/lab/quizzes/${activeQuiz.id}/submit/`, { method: 'POST', body: JSON.stringify({ answers: payload }) });
            setResult(res);
        } catch (err) { showToast(err.message, 'error'); }
    };

    if (result) {
        const total = activeQuiz.questions?.length || 1;
        return (
            <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem' }}>{result.score === total ? '🎉' : result.score >= total / 2 ? '👍' : '😅'}</div>
                <div className="card-title">Результат вікторини</div>
                <p style={{ fontSize: '2rem', fontWeight: 700 }}>{result.score} / {total}</p>
                <button className="btn btn-primary" onClick={() => { setResult(null); setActiveQuiz(null); setAnswers({}); }}>Назад до вікторин</button>
            </div>
        );
    }

    if (activeQuiz) {
        return (
            <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
                <div className="card-title">💡 {activeQuiz.title}</div>
                {activeQuiz.questions?.map((q, qi) => (
                    <div key={q.id} style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: 12 }}>
                        <p style={{ fontWeight: 600 }}>{qi + 1}. {q.text}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {q.choices?.map(c => (
                                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.4rem', borderRadius: 8, background: answers[q.id] === c.id ? 'var(--accent-light, rgba(99,102,241,0.1))' : 'transparent' }}>
                                    <input type="radio" name={`q_${q.id}`} value={c.id} checked={answers[q.id] === c.id} onChange={() => selectChoice(q.id, c.id)} />
                                    {c.text}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" onClick={() => setActiveQuiz(null)}>← Назад</button>
                    <button className="btn btn-primary" onClick={submit}>Відправити відповіді</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {quizzes.length === 0 && (
                <div className="empty-state">
                    <span className="empty-state-icon">💡</span>
                    <p>Вікторин ще немає. Адмін може додати їх через API або Swagger (/api/swagger/).</p>
                </div>
            )}
            {quizzes.map(q => (
                <div key={q.id} className="card">
                    <div className="card-title">💡 {q.title}</div>
                    <p style={{ color: 'var(--text-muted)' }}>{q.questions?.length ?? 0} питань</p>
                    <button className="btn btn-primary btn-sm" onClick={() => { setActiveQuiz(q); setAnswers({}); }}>Пройти вікторину</button>
                </div>
            ))}
        </div>
    );
}
