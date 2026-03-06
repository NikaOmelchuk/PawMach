
const API_BASE = '/api/v1';

function getToken() {
    return localStorage.getItem('token');
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

async function apiFetch(path, options = {}) {
    const token = getToken();
    const csrfToken = getCookie('csrftoken');
    const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token ? { 'Authorization': `Token ${token}` } : {}),
        ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return;
    }

    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message = data?.detail || data?.non_field_errors?.[0]
            || Object.values(data || {})[0]?.[0]
            || `Помилка ${response.status}`;
        throw new Error(message);
    }

    return data;
}

function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const icons = { success: '✅', error: '❌', info: '💜' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || '💜'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch { return null; }
}
function isLoggedIn() { return !!getToken(); }
function requireAuth() {
    if (!isLoggedIn()) { window.location.href = '/'; return false; }
    return true;
}

async function syncUserProfile() {
    if (!isLoggedIn()) return null;
    try {
        const profile = await apiFetch('/auth/profile/');
        localStorage.setItem('user', JSON.stringify(profile));

        const nameEl = document.getElementById('nav-username');
        const avatarEl = document.getElementById('user-avatar-letter');

        if (nameEl) nameEl.textContent = profile.username || 'Профіль';

        if (avatarEl) {
            if (profile.avatar) {

                const img = document.createElement('img');
                img.src = profile.avatar;
                img.className = 'user-avatar';
                img.title = 'Профіль';
                img.id = 'user-avatar-img';
                img.style.objectFit = 'cover';
                avatarEl.replaceWith(img);
            } else {

                avatarEl.textContent = (profile.username || 'U')[0].toUpperCase();
            }
        } else {

            const imgEl = document.getElementById('user-avatar-img');
            if (imgEl) {
                if (profile.avatar) {
                    imgEl.src = profile.avatar;
                } else {
                    const div = document.createElement('div');
                    div.className = 'user-avatar';
                    div.id = 'user-avatar-letter';
                    div.title = 'Профіль';
                    div.textContent = (profile.username || 'U')[0].toUpperCase();
                    imgEl.replaceWith(div);
                }
            }
        }
        return profile;
    } catch (err) {
        console.error('Помилка синхронізації профілю:', err);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeBtns = document.querySelectorAll('.btn-theme-toggle');
    themeBtns.forEach(btn => {
        btn.innerHTML = savedTheme === 'dark' ? '🌞' : '🌙';
        btn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            document.querySelectorAll('.btn-theme-toggle').forEach(b => b.innerHTML = next === 'dark' ? '🌞' : '🌙');
        });
    });

    const shareBtns = document.querySelectorAll('.btn-share');
    shareBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const url = window.location.href;
            const title = document.title;
            if (navigator.share) {
                try { await navigator.share({ title, url }); }
                catch (err) { console.log('Share error:', err); }
            } else {
                navigator.clipboard.writeText(url);
                showToast('📍 Посилання скопійовано!', 'info');
            }
        });
    });
});
