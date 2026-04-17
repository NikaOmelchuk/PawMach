import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

import { useAuth } from '../context/AuthContext';

function renderWithRouter(isLoggedIn) {
    useAuth.mockReturnValue({ isLoggedIn });
    return render(
        <MemoryRouter initialEntries={['/protected']}>
            <Routes>
                <Route path="/" element={<div>Login Page</div>} />
                <Route path="/protected" element={
                    <ProtectedRoute>
                        <div>Protected Content</div>
                    </ProtectedRoute>
                } />
            </Routes>
        </MemoryRouter>
    );
}

describe('ProtectedRoute', () => {
    test('рендерить children якщо користувач авторизований', () => {
        renderWithRouter(true);
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('редіректить на "/" якщо не авторизований', () => {
        renderWithRouter(false);
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
});
