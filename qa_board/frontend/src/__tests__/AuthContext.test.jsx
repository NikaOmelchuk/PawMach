import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

jest.mock('../api', () => ({
    apiFetch: jest.fn(),
    getToken: jest.fn(() => null),
    getCurrentUser: jest.fn(() => null),
    initTheme: jest.fn(() => 'light'),
}));

function TestConsumer() {
    const { token, user, isLoggedIn, login, logout } = useAuth();
    return (
        <div>
            <span data-testid="logged">{String(isLoggedIn)}</span>
            <span data-testid="username">{user?.username || 'none'}</span>
            <button onClick={() => login('tok123', { username: 'meona' })}>Login</button>
            <button onClick={() => logout()}>Logout</button>
        </div>
    );
}

function renderWithProvider() {
    return render(
        <AuthProvider>
            <TestConsumer />
        </AuthProvider>
    );
}

beforeEach(() => {
    localStorage.clear();
});

describe('AuthContext', () => {
    test('початковий стан — не авторизований', () => {
        renderWithProvider();
        expect(screen.getByTestId('logged').textContent).toBe('false');
        expect(screen.getByTestId('username').textContent).toBe('none');
    });

    test('login зберігає token і user', async () => {
        renderWithProvider();
        await act(async () => {
            screen.getByText('Login').click();
        });
        expect(screen.getByTestId('logged').textContent).toBe('true');
        expect(screen.getByTestId('username').textContent).toBe('meona');
        expect(localStorage.getItem('token')).toBe('tok123');
    });

    test('logout очищає стан', async () => {
        renderWithProvider();
        await act(async () => {
            screen.getByText('Login').click();
        });
        await act(async () => {
            screen.getByText('Logout').click();
        });
        expect(screen.getByTestId('logged').textContent).toBe('false');
        expect(localStorage.getItem('token')).toBeNull();
    });
});
