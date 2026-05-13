import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler';

/**
 * APP ROOT
 * --------
 * Sets up routing and global context providers.
 * - AuthProvider: manages JWT + user state
 * - WebSocketProvider: manages STOMP connection (only active when logged in)
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            {/* Default: redirect to dashboard (which redirects to login if not auth'd) */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
