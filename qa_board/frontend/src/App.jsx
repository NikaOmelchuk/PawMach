import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import SurveyPage from './pages/SurveyPage';
import SessionPage from './pages/SessionPage';
import ResultsPage from './pages/ResultsPage';
import ProfilePage from './pages/ProfilePage';
import LabServicesPage from './pages/LabServicesPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/survey/:id" element={
            <ProtectedRoute><SurveyPage /></ProtectedRoute>
          } />
          <Route path="/session/:id" element={
            <ProtectedRoute><SessionPage /></ProtectedRoute>
          } />
          <Route path="/results/:id" element={
            <ProtectedRoute><ResultsPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/services" element={
            <ProtectedRoute><LabServicesPage /></ProtectedRoute>
          } />
          <Route path="/about" element={
            <ProtectedRoute><AboutPage /></ProtectedRoute>
          } />

          { }
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
