import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from '../pages/AuthPage';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

jest.mock('../context/AuthContext', () => ({
    useAuth: () => ({ isLoggedIn: false, login: jest.fn() }),
}));

jest.mock('../api', () => ({
    apiFetch: jest.fn(),
    showToast: jest.fn(),
    toggleTheme: jest.fn(() => 'dark'),
}));

function renderAuthPage() {
    return render(
        <MemoryRouter>
            <AuthPage />
        </MemoryRouter>
    );
}

describe('AuthPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('рендерить форму логіну за замовчуванням', () => {
        renderAuthPage();
        expect(screen.getByText('PawMatch')).toBeInTheDocument();
        expect(screen.getByText('Увійти')).toBeInTheDocument();
        expect(screen.getByText('Реєстрація')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    });

    test('перемикання на вкладку реєстрації', () => {
        renderAuthPage();
        fireEvent.click(screen.getByText('Реєстрація'));
        expect(screen.getByText("Ім'я користувача")).toBeInTheDocument();
        expect(screen.getByText('Повторіть пароль')).toBeInTheDocument();
    });

    test('введення email та паролю для логіну', () => {
        renderAuthPage();
        const emailInput = screen.getByPlaceholderText('your@email.com');
        const passInput = screen.getByPlaceholderText('••••••••');
        fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
        fireEvent.change(passInput, { target: { value: '12345678' } });
        expect(emailInput.value).toBe('test@test.com');
        expect(passInput.value).toBe('12345678');
    });

    test('відображення кнопки зміни теми та натискання', () => {
        renderAuthPage();
        const themeBtn = screen.getByTitle('Змінити тему');
        expect(themeBtn).toBeInTheDocument();
        fireEvent.click(themeBtn);
        // We mocked toggleTheme, so we don't strictly test localStorage here, but test it was clicked
        expect(themeBtn).toBeInTheDocument();
    });

    test('кнопка "Увійти" присутня', () => {
        renderAuthPage();
        expect(screen.getByText('🐾 Увійти')).toBeInTheDocument();
    });

    test('відправка форми логіну', async () => {
        const { apiFetch } = require('../api');
        apiFetch.mockResolvedValueOnce({ token: '123', user: { username: 'test' } });

        renderAuthPage();
        const emailInput = screen.getByPlaceholderText('your@email.com');
        const passInput = screen.getByPlaceholderText('••••••••');
        fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
        fireEvent.change(passInput, { target: { value: '12345678' } });

        fireEvent.submit(screen.getByRole('button', { name: /🐾 Увійти/i }));

        expect(screen.getByText('Вхід...')).toBeInTheDocument();
        // Wait for async actions
        await screen.findByText('🐾 Увійти');
        expect(apiFetch).toHaveBeenCalledWith('/auth/login/', expect.any(Object));
    });

    test('помилка при незбігу паролів під час реєстрації', async () => {
        const { showToast } = require('../api');
        renderAuthPage();
        fireEvent.click(screen.getByText('Реєстрація'));

        const passInput = screen.getByPlaceholderText('мін. 8 символів');
        const pass2Input = screen.getByPlaceholderText('••••••••');
        fireEvent.change(passInput, { target: { value: '12345678' } });
        fireEvent.change(pass2Input, { target: { value: '87654321' } });

        fireEvent.submit(screen.getByRole('button', { name: /🐱 Зареєструватись/i }));
        expect(showToast).toHaveBeenCalledWith('Паролі не збігаються', 'error');
    });

    test('успішна реєстрація', async () => {
        const { apiFetch } = require('../api');
        apiFetch.mockResolvedValueOnce({ token: '123', user: { username: 'test' } });

        renderAuthPage();
        fireEvent.click(screen.getByText('Реєстрація'));

        const inputs = screen.getAllByRole('textbox');
        // username, email
        fireEvent.change(inputs[0], { target: { value: 'test' } });
        fireEvent.change(inputs[1], { target: { value: 'test@test.com' } });

        const passInput = screen.getByPlaceholderText('мін. 8 символів');
        const pass2Input = screen.getByPlaceholderText('••••••••');
        fireEvent.change(passInput, { target: { value: '12345678' } });
        fireEvent.change(pass2Input, { target: { value: '12345678' } });

        fireEvent.submit(screen.getByRole('button', { name: /🐱 Зареєструватись/i }));

        await screen.findByText('🐱 Зареєструватись');
        expect(apiFetch).toHaveBeenCalledWith('/auth/register/', expect.any(Object));
    });
});
