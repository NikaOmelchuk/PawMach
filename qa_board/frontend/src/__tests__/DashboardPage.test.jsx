import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

jest.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: { username: 'meona', email: 'test@test.com', avatar: null },
        logout: jest.fn(),
        syncProfile: jest.fn(),
    }),
}));

jest.mock('../api', () => ({
    apiFetch: jest.fn().mockResolvedValue({ results: [] }),
    showToast: jest.fn(),
    toggleTheme: jest.fn(() => 'dark'),
    sharePage: jest.fn(),
    getMediaUrl: jest.fn(),
}));

function renderDashboard() {
    return render(
        <MemoryRouter>
            <DashboardPage />
        </MemoryRouter>
    );
}

describe('DashboardPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('рендерить заголовок та ініціалізує дані', async () => {
        await act(async () => {
             renderDashboard();
        });
        expect(screen.getByText(/Опитування на сумісність/)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('ABC123')).toBeInTheDocument();
        expect(screen.getByText(/Приєднатись/)).toBeInTheDocument();
        expect(screen.getByText('Всі категорії')).toBeInTheDocument();
    });

    test('завантаження та відображення категорій, опитувань та сесій', async () => {
        const { apiFetch } = require('../api');
        apiFetch.mockImplementation(async (url) => {
            if (url === '/categories/') return { results: [{ id: 1, name: 'Кіт', icon: '🐱' }] };
            if (url.includes('/surveys/')) return { results: [{ id: 10, title: 'Мій Тест', question_count: 5, max_participants: 2, is_active: true }] };
            if (url === '/sessions/') return { results: [{ id: 100, session_code: 'XYZ789', status: 'waiting', survey: { title: 'Мій Тест' } }] };
            return { results: [] };
        });

        await act(async () => {
            renderDashboard();
        });

        expect(screen.getByText('XYZ789')).toBeInTheDocument();

        expect(screen.getByText('🐱 Кіт')).toBeInTheDocument();

        expect(screen.getAllByText('Мій Тест').length).toBeGreaterThan(0);

        await act(async () => {
            fireEvent.click(screen.getByText('🐱 Кіт'));
        });
        expect(apiFetch).toHaveBeenCalledWith('/surveys/?category=1');

        await act(async () => {
            fireEvent.click(screen.getAllByText('Почати →')[0]);
        });
        expect(mockNavigate).toHaveBeenCalledWith('/survey/10');
    });

    test('спроба приєднання з пустим кодом', async () => {
        const { showToast } = require('../api');
        await act(async () => {
            renderDashboard();
        });
        
        await act(async () => {
            fireEvent.submit(screen.getByRole('button', { name: /Приєднатись/i }));
        });
        expect(showToast).toHaveBeenCalledWith('Введіть код сесії', 'error');
    });

    test('успішне приєднання до сесії', async () => {
        const { apiFetch } = require('../api');
        apiFetch.mockImplementation(async (url) => {
            if (url === '/sessions/join/') return { id: 55, session_code: 'QWE1234' };
            return { results: [] };
        });

        await act(async () => {
            renderDashboard();
        });

        const input = screen.getByPlaceholderText('ABC123');
        await act(async () => {
            fireEvent.change(input, { target: { value: 'qwe1234' } });
        });
        
        await act(async () => {
            fireEvent.submit(screen.getByRole('button', { name: /Приєднатись/i }));
        });
        expect(apiFetch).toHaveBeenCalledWith('/sessions/join/', expect.any(Object));
    });
});
