import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuth2RedirectHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      try {
        // Decode JWT payload (middle part of the token)
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        login({
          token: token,
          userId: payload.sub,
          username: payload.username,
          email: payload.email,
          fullName: payload.fullName || payload.name || payload.username,
        });
        
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to parse OAuth2 token', err);
        navigate('/login?error=oauth_failed');
      }
    } else {
      navigate('/login?error=no_token');
    }
  }, [searchParams, navigate, login]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
      <div className="spinner"></div>
      <p style={{ marginLeft: '10px' }}>Authenticating with Google...</p>
    </div>
  );
}
