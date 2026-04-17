import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

const mockLogout = jest.fn();
jest.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: { username: 'meona', email: 'test@test.com', avatar: null },
        logout: mockLogout,
    }),
}));

jest.mock('../api', () => ({
    toggleTheme: jest.fn(() => 'dark'),
    sharePage: jest.fn(),
    getMediaUrl: jest.fn(),
}));

function renderNavbar(props = {}) {
    return render(
        <MemoryRouter>
            <Navbar {...props} />
        </MemoryRouter>
    );
}

describe('Navbar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('рендерить бренд PawMatch', () => {
        renderNavbar();
        expect(screen.getByText(/PawMatch/)).toBeInTheDocument();
    });

    test('відображає навігаційні лінки', () => {
        renderNavbar({ activeLink: 'dashboard' });
        expect(screen.getAllByText('Опитування').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Про додаток/).length).toBeGreaterThan(0);
    });

    test('показує кнопку "←\u00a0Назад" при backLink', () => {
        renderNavbar({ backLink: '/dashboard' });
        expect(screen.getAllByText('← Назад').length).toBeGreaterThan(0);
    });

    test('відображає username користувача', () => {
        renderNavbar();
        expect(screen.getAllByText('meona').length).toBeGreaterThan(0);
    });

    test('показує першу літеру username як аватар', () => {
        renderNavbar();
        expect(screen.getAllByText('M').length).toBeGreaterThan(0);
    });

    test('взаємодія з мобільним меню: відкриття та закриття', () => {
        renderNavbar();
        const menuBtn = screen.getByLabelText('Меню');

        // Відкрити меню
        fireEvent.click(menuBtn);
        expect(screen.getByText('✕')).toBeInTheDocument();

        // Закрити меню
        fireEvent.click(menuBtn);
        expect(screen.getByText('☰')).toBeInTheDocument();
    });

    test('натискання "Вийти" викликає logout', async () => {
        const authContext = require('../context/AuthContext');
        renderNavbar();

        const logoutBtns = screen.getAllByText(/Вийти/);
        // натискаємо на десктопну кнопку виходу
        await act(async () => {
            fireEvent.click(logoutBtns[0]);
        });

        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('перемикач теми викликається', () => {
        const { toggleTheme } = require('../api');
        renderNavbar();
        const themeBtns = screen.getAllByTitle('Змінити тему');
        fireEvent.click(themeBtns[0]);
        // toggleTheme is executed synchronously when clicked
        expect(toggleTheme).toHaveBeenCalled();
    });

    test('перемикач "Поділитись" викликається', () => {
        const { sharePage } = require('../api');
        renderNavbar();
        const shareBtns = screen.getAllByTitle('Поділитись');
        fireEvent.click(shareBtns[0]);
        expect(sharePage).toHaveBeenCalled();
    });
});
