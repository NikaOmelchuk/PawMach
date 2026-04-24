import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { apiFetch, showToast } from '../api';

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTasks();

        const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${wsProto}://${window.location.host}/ws/admin/tasks/`;
        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setTasks(prev => [data, ...prev]);
            showToast(`Задача "${data.task_name}" завершена!`, 'success');
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
        try {
            await apiFetch('/tasks/trigger-email/', {
                method: 'POST',
                body: JSON.stringify({
                    subject: 'Вітання від системи ПавМатч!',
                    message: 'Це асинхронне повідомлення.',
                    recipients: ['admin@example.com']
                })
            });
            showToast('Задачу розсилки додано в чергу', 'info');
        } catch (err) { showToast(err.message, 'error'); }
    }

    async function triggerReport() {
        try {
            await apiFetch('/lab/quizzes/1/trigger_report/', { method: 'POST' });
            showToast('Задачу генерації звіту додано в чергу', 'info');
        } catch (err) { showToast(err.message, 'error'); }
    }

    return (
        <div>
            <Navbar activeLink="admin-tasks" />
            <div className="page-wrapper">
                <div className="page-header">
                    <h1 className="page-title">⚙️ Управління асинхронними задачами</h1>
                    <p className="page-subtitle">Моніторинг статусів та запуск нових операцій</p>
                </div>

                <div className="mb-4" style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={triggerEmail}>📧 Запустити розсилку</button>
                    <button className="btn btn-primary" onClick={triggerReport}>📊 Згенерувати звіт (10с)</button>
                </div>

                {loading ? (
                    <div className="loader"><div className="spinner" /><span>Завантаження...</span></div>
                ) : (
                    <div className="card">
                        <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ padding: '0.75rem' }}>Назва операції</th>
                                    <th style={{ padding: '0.75rem' }}>Дані</th>
                                    <th style={{ padding: '0.75rem' }}>Результат</th>
                                    <th style={{ padding: '0.75rem' }}>Завершено</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((t, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
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
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Задач ще не виконувалось</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
