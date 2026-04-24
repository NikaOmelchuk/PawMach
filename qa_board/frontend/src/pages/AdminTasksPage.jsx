import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { apiFetch, showToast } from '../api';

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [emailBusy, setEmailBusy] = useState(false);
    const [reportBusy, setReportBusy] = useState(false);

    useEffect(() => {
        loadTasks();

        const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${wsProto}://${window.location.host}/ws/admin/tasks/`;
        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setTasks(prev => [data, ...prev]);
            showToast(`✅ Задача "${data.task_name}" завершена!`, 'success');
        };

        return () => socket.close();
    }, []);

    async function loadTasks() {
        try {
            const data = await apiFetch('/lab/async-tasks/');
            setTasks(data.results || data);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    async function triggerEmail() {
        setEmailBusy(true);
        try {
            await apiFetch('/lab/email-broadcast/send/', { method: 'POST' });
            showToast('📧 Email-розсилку поставлено у чергу. Результат з\'явиться в таблиці.', 'info');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setEmailBusy(false);
        }
    }

    async function triggerReport() {
        setReportBusy(true);
        try {
            const res = await apiFetch('/lab/report-generation/generate/', { method: 'POST' });
            showToast(`📊 Звіт для сесії «${res.survey}» поставлено у чергу. Зачекайте ~10 сек.`, 'info');
        } catch (err) {
            const msg = err.message.includes('404')
                ? '❗ Немає жодної сесії опитування. Спочатку створіть та проведіть сесію.'
                : err.message;
            showToast(msg, 'error');
        } finally {
            setReportBusy(false);
        }
    }

    return (
        <div>
            <Navbar activeLink="admin-tasks" />
            <div className="page-wrapper">
                <div className="page-header">
                    <h1 className="page-title">⚙️ Управління асинхронними задачами</h1>
                    <p className="page-subtitle">
                        Моніторинг статусів та запуск нових операцій у реальному часі
                    </p>
                </div>

                <div className="mb-4" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-primary"
                        onClick={triggerEmail}
                        disabled={emailBusy}
                        title="Надіслати email-запрошення всім зареєстрованим користувачам"
                    >
                        {emailBusy ? '⏳ Відправляємо...' : '📧 Надіслати Email усім'}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={triggerReport}
                        disabled={reportBusy}
                        title="Запустити розрахунок сумісності (займе ~10 сек)"
                    >
                        {reportBusy ? '⏳ Генеруємо...' : '📊 Згенерувати звіт (10 с)'}
                    </button>
                </div>

                {loading ? (
                    <div className="loader"><div className="spinner" /><span>Завантаження...</span></div>
                ) : (
                    <div className="card">
                        <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ padding: '0.75rem' }}>Назва операції</th>
                                    <th style={{ padding: '0.75rem' }}>Дані операції</th>
                                    <th style={{ padding: '0.75rem' }}>Результат</th>
                                    <th style={{ padding: '0.75rem' }}>Дата / час завершення</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((t, idx) => (
                                    <tr key={t.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{t.task_name}</td>
                                        <td style={{ padding: '0.75rem' }}>{t.task_data}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span className="badge badge-success">{t.result}</span>
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{t.completed_at}</td>
                                    </tr>
                                ))}
                                {tasks.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            ⏳ Задач ще не виконувалось. Натисніть одну з кнопок вище.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{
                    marginTop: '1.5rem', padding: '1rem', background: 'var(--card-bg)', borderRadius: '8px',
                    border: '1px solid var(--border-color)', fontSize: '0.875rem', color: 'var(--text-muted)'
                }}>
                    💡 <strong>Як це працює:</strong> Email-розсилка виконується у черзі <code>email</code>,
                    а генерація звіту - у черзі <code>default</code>. Результати з'являються автоматично
                    через WebSocket без перезавантаження сторінки.
                </div>
            </div>
        </div>
    );
}
