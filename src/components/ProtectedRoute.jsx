import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PROTECTED ROUTE
 * ---------------
 * Wraps pages that require authentication.
 * Redirects to /login if the user is not logged in.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'var(--text-secondary)',
      }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
