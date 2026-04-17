import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AboutPage from '../pages/AboutPage';

jest.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: { username: 'meona', email: 'test@test.com', avatar: null },
        logout: jest.fn(),
    }),
}));

jest.mock('../api', () => ({
    toggleTheme: jest.fn(() => 'dark'),
    sharePage: jest.fn(),
    getMediaUrl: jest.fn(),
}));

function renderAboutPage() {
    return render(
        <MemoryRouter>
            <AboutPage />
        </MemoryRouter>
    );
}

describe('AboutPage', () => {
    test('рендерить заголовок PawMatch', () => {
        renderAboutPage();
        expect(screen.getAllByText('PawMatch').length).toBeGreaterThan(0);
    });

    test('відображає текст опису додатку', () => {
        renderAboutPage();
        expect(screen.getByText(/платформа для визначення сумісності/)).toBeInTheDocument();
    });

    test('показує перелік технологій', () => {
        renderAboutPage();
        expect(screen.getByText('Python')).toBeInTheDocument();
        expect(screen.getByText('Django')).toBeInTheDocument();
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('Vite')).toBeInTheDocument();
    });

    test('відображає ім\'я виконавця', () => {
        renderAboutPage();
        expect(screen.getByText('Омельчук Ніка Романівна')).toBeInTheDocument();
    });
});
