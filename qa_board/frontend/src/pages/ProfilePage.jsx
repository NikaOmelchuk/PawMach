import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { apiFetch, getToken, getCookie, showToast, getMediaUrl } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { updateUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [activeSessions, setActiveSessions] = useState([]);
    const [leavingId, setLeavingId] = useState(null);

    const [form, setForm] = useState({
        username: '', email: '', first_name: '', last_name: '',
        gender: '', birth_date: '', bio: '',
    });

    useEffect(() => {
        loadProfile();
        loadActiveSessions();
    }, []);

    async function loadProfile() {
        try {
            const data = await apiFetch('/auth/profile/');
            setProfile(data);
            setForm({
                username: data.username || '',
                email: data.email || '',
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                gender: data.gender || '',
                birth_date: data.birth_date || '',
                bio: data.bio || '',
            });
            if (data.avatar) setAvatarPreview(getMediaUrl(data.avatar));
        } catch {
            showToast('Помилка завантаження профілю', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function loadActiveSessions() {
        try {
            const data = await apiFetch('/sessions/');
            const sessions = data.results || data;
            setActiveSessions(sessions.filter(s => s.status !== 'completed'));
        } catch { }
    }

    async function leaveSession(sess) {
        const isOrganizer = sess.created_by?.id === profile?.id;
        const confirmed = window.confirm(
            isOrganizer
                ? `Ви організатор. Сесія "${sess.survey?.title}" буде видалена для всіх учасників. Продовжити?`
                : `Покинути сесію "${sess.survey?.title}"?`
        );
        if (!confirmed) return;
        setLeavingId(sess.id);
        try {
            await apiFetch(`/sessions/${sess.id}/leave/`, { method: 'DELETE' });
            setActiveSessions(prev => prev.filter(s => s.id !== sess.id));
            showToast(isOrganizer ? 'Сесію видалено 🗑' : 'Ви покинули сесію 🚪', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLeavingId(null);
        }
    }

    function handleAvatarChange(e) {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('username', form.username);
            formData.append('first_name', form.first_name);
            formData.append('last_name', form.last_name);
            formData.append('bio', form.bio);
            if (form.gender) formData.append('gender', form.gender);
            if (form.birth_date) formData.append('birth_date', form.birth_date);
            if (avatarFile) formData.append('avatar', avatarFile);

            const token = getToken();
            const csrfToken = getCookie('csrftoken');
            const response = await fetch('/api/v1/auth/profile/', {
                method: 'PATCH',
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    ...(token ? { Authorization: `Token ${token}` } : {}),
                    ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
                },
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(Object.values(data)[0] || 'Помилка збереження');
            }

            const updatedUser = await response.json();
            updateUser(updatedUser);
            showToast('Профіль успішно оновлено!', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return (
        <div><Navbar activeLink="profile" />
            <div className="page-wrapper"><div className="loader"><div className="spinner" /><span>Завантаження...</span></div></div>
        </div>
    );

    return (
        <div>
            <Navbar activeLink="profile" />
            <div className="page-wrapper">
                <div style={{ maxWidth: 600, margin: '40px auto', background: 'var(--surface)', borderRadius: 12, padding: 30, boxShadow: '0 8px 32px var(--shadow)', border: '1px solid var(--border)' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: 25 }}>Налаштування профілю</h2>

                    <form onSubmit={handleSave}>

                        <div style={{ textAlign: 'center', marginBottom: 30 }}>
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="avatar"
                                    style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 20px', display: 'block', border: '4px solid var(--bg)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            ) : (
                                <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 20px', border: '4px solid var(--bg)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    {(form.username || 'U')[0].toUpperCase()}
                                </div>
                            )}
                            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
                                📸 Змінити фото
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                            </label>
                        </div>

                        <div className="form-group">
                            <label>Email (недоступно для зміни)</label>
                            <input type="email" className="form-control" disabled value={form.email}
                                style={{ background: 'var(--bg)', color: 'var(--text-mid)', cursor: 'not-allowed' }} onChange={() => { }} />
                        </div>

                        <div className="form-group">
                            <label>Нікнейм (Username)</label>
                            <input type="text" className="form-control" required value={form.username}
                                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <div className="form-group">
                                <label>Ім'я</label>
                                <input type="text" className="form-control" value={form.first_name}
                                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label>Прізвище</label>
                                <input type="text" className="form-control" value={form.last_name}
                                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <div className="form-group">
                                <label>Стать</label>
                                <select className="form-control" value={form.gender}
                                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                                    <option value="">Не вказано</option>
                                    <option value="M">Чоловік</option>
                                    <option value="F">Жінка</option>
                                    <option value="O">Інше</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Дата народження</label>
                                <input type="date" className="form-control" value={form.birth_date}
                                    onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Про себе</label>
                            <textarea className="form-control" rows={3} placeholder="Розкажіть трохи про себе..."
                                value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 15 }} disabled={saving}>
                            {saving ? 'Збереження...' : 'Зберегти зміни'}
                        </button>
                    </form>
                </div>


                {activeSessions.length > 0 && (
                    <div style={{ maxWidth: 600, margin: '0 auto 40px' }}>
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
                                <span style={{ fontSize: '1rem' }}>🚀</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--lavender-deep)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Активні сесії ({activeSessions.length})
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {activeSessions.map(sess => {
                                    const isOrg = sess.created_by?.id === profile?.id;
                                    const leaving = leavingId === sess.id;
                                    return (
                                        <div key={sess.id} className="active-session-row">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                                                <span className="session-dot-live" title="Активна" />
                                                <span className="session-code-pill">{sess.session_code}</span>
                                                <span className="session-title-inline" title={sess.survey?.title}>
                                                    {sess.survey?.title}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                    👥 {sess.participants?.length ?? '—'}
                                                </span>
                                                {isOrg && (
                                                    <span className="badge" style={{ fontSize: '0.6rem', padding: '0.1rem 0.45rem' }}>Орг.</span>
                                                )}
                                                <button
                                                    className="btn-session-leave"
                                                    onClick={() => leaveSession(sess)}
                                                    disabled={leaving}
                                                    title={isOrg ? 'Видалити' : 'Покинути'}
                                                >
                                                    {leaving ? '…' : isOrg ? '🗑' : '🚪'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
