import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../theme.css';
import './LoginPage.css';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPw) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await signup(name.trim(), mobile.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bw-page auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">Tickets</Link>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Sign up to book your tickets</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Name
            <input
              className="bw-input"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>

          <label className="auth-label">
            Mobile number
            <div className="auth-phone-wrap">
              <span className="auth-phone-prefix">+91</span>
              <input
                className="bw-input auth-phone-input"
                type="tel"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                maxLength={10}
                autoComplete="tel"
              />
            </div>
          </label>

          <label className="auth-label">
            Password
            <div className="auth-pw-wrap">
              <input
                className="bw-input"
                type={showPw ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <label className="auth-label">
            Confirm password
            <input
              className="bw-input"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="bw-btn-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
