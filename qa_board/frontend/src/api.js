

const API_BASE = '/api/v1';

export function getToken() {
    return localStorage.getItem('token');
}

export function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + '=') {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export async function apiFetch(path, options = {}) {
    const token = getToken();
    const csrfToken = getCookie('csrftoken');
    const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'ngrok-skip-browser-warning': 'true',
        ...(token ? { Authorization: `Token ${token}` } : {}),
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
        const message =
            data?.detail ||
            data?.non_field_errors?.[0] ||
            Object.values(data || {})[0]?.[0] ||
            `Помилка ${response.status}`;
        throw new Error(message);
    }

    return data;
}

export function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
}

export function isLoggedIn() {
    return !!getToken();
}

export function getMediaUrl(path) {
    if (!path) return null;
    if (path.startsWith('http://localhost') || path.startsWith('http://127.0.0.1')) {
        try {
            return new URL(path).pathname;
        } catch {
            return path;
        }
    }
    return path;
}

export function showToast(message, type = 'info') {
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

export function initTheme() {
    const saved =
        localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', saved);
    return saved;
}

export function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    return next;
}

export async function sharePage() {
    const url = window.location.href;
    const title = document.title;

    let shared = false;
    if (navigator.share) {
        try {
            await navigator.share({ title, url });
            shared = true;
        } catch (err) {
            console.warn('Share API failed or rejected, falling back to clipboard.', err);
        }
    }

    if (!shared) {
        try {
            await navigator.clipboard.writeText(url);
            showToast('Посилання скопійовано!', 'info');
        } catch (err) {
            showToast('Не вдалося скопіювати посилання', 'error');
        }
    }
}
