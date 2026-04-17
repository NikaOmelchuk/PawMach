import { getToken, getCookie, getCurrentUser, isLoggedIn, getMediaUrl, initTheme, toggleTheme } from '../api';

beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.cookie = '';
});

describe('getToken', () => {
    test('повертає токен з localStorage', () => {
        localStorage.setItem('token', 'test-token-123');
        expect(getToken()).toBe('test-token-123');
    });

    test('повертає null якщо токен відсутній', () => {
        expect(getToken()).toBeNull();
    });
});

describe('getCurrentUser', () => {
    test('парсить JSON користувача з localStorage', () => {
        const user = { id: 1, username: 'meona', email: 'test@test.com' };
        localStorage.setItem('user', JSON.stringify(user));
        expect(getCurrentUser()).toEqual(user);
    });

    test('повертає null при невалідному JSON', () => {
        localStorage.setItem('user', 'invalid-json');
        expect(getCurrentUser()).toBeNull();
    });
});

describe('isLoggedIn', () => {
    test('повертає true якщо є токен', () => {
        localStorage.setItem('token', 'abc');
        expect(isLoggedIn()).toBe(true);
    });

    test('повертає false якщо немає токена', () => {
        expect(isLoggedIn()).toBe(false);
    });
});

describe('getMediaUrl', () => {
    test('повертає null для порожнього path', () => {
        expect(getMediaUrl(null)).toBeNull();
        expect(getMediaUrl('')).toBeNull();
    });

    test('конвертує localhost URL у pathname', () => {
        expect(getMediaUrl('http://localhost:8000/media/avatar.jpg')).toBe('/media/avatar.jpg');
    });

    test('повертає path як є для звичайних шляхів', () => {
        expect(getMediaUrl('/media/avatar.jpg')).toBe('/media/avatar.jpg');
    });
});

describe('initTheme', () => {
    test('встановлює тему з localStorage', () => {
        localStorage.setItem('theme', 'dark');
        const result = initTheme();
        expect(result).toBe('dark');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    test('встановлює light за замовчуванням', () => {
        const result = initTheme();
        expect(result).toBe('light');
    });
});

describe('toggleTheme', () => {
    test('перемикає light → dark', () => {
        document.documentElement.setAttribute('data-theme', 'light');
        const result = toggleTheme();
        expect(result).toBe('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
    });

    test('перемикає dark → light', () => {
        document.documentElement.setAttribute('data-theme', 'dark');
        const result = toggleTheme();
        expect(result).toBe('light');
        expect(localStorage.getItem('theme')).toBe('light');
    });
});
