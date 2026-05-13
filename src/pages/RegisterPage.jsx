import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../config/api';

/**
 * REGISTER PAGE
 * -------------
 * Sends registration data directly to Auth microservice.
 * On success, redirects to Login with a ?registered=true query flag.
 */
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API.AUTH}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || 'Registration failed');
      }

      navigate('/login?registered=true');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-reveal">
      <div className="auth-card glass">
        <h1 className="gradient-text">Join ConnectHub</h1>
        <p className="subtitle">Start your journey with us today</p>

        {error && <div className="error-banner animate-reveal">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="label" htmlFor="reg-fullname">Full Name</label>
            <input
              id="reg-fullname"
              className="input"
              name="fullName"
              placeholder="Your Name"
              value={formData.fullName}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="label" htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              className="input"
              name="username"
              placeholder="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              className="input"
              type="email"
              name="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? <div className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '24px 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
          OR REGISTER WITH
        </div>

        <button 
          className="btn btn-secondary btn-block" 
          onClick={() => window.location.href = 'http://localhost:8081/oauth2/authorization/google'}
          style={{ marginBottom: 32, gap: 12 }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M47.532 24.5528C47.532 22.8886 47.3908 21.2843 47.1145 19.7409H24.48V28.9181H37.4434C36.9059 31.8988 35.177 34.5356 32.6461 36.2311V42.2339H40.3989C44.9217 38.0691 47.532 31.8847 47.532 24.5528Z" fill="#4285F4"/>
            <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3988 42.2339L32.6461 36.2311C30.5051 37.665 27.7259 38.5031 24.48 38.5031C18.2273 38.5031 12.9188 34.2223 11.0139 28.5141H3.03296V34.6971C7.00346 42.5688 15.1183 48.0016 24.48 48.0016Z" fill="#34A853"/>
            <path d="M11.0138 28.5141C10.5189 27.0371 10.2359 25.467 10.2359 23.8341C10.2359 22.2013 10.5189 20.6312 11.0138 19.1541V12.9712H3.03285C1.3554 16.3412 0.400024 20.1568 0.400024 24.1671C0.400024 28.1773 1.3554 31.993 3.03285 35.3629L11.0138 28.5141Z" fill="#FBBC05"/>
            <path d="M24.48 9.49863C28.01 9.49863 31.1802 10.7161 33.6817 13.0919L40.5755 6.19813C36.3974 2.3615 30.9388 0 24.48 0C15.1183 0 7.00346 5.43288 3.03296 13.3045L11.0139 19.4875C12.9188 13.7792 18.2273 9.49863 24.48 9.49863Z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <div className="form-footer">
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
