import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../theme.css';
import './LoginPage.css';

export default function LoginPage({ defaultTab = 'user' }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'user' | 'admin'
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Admin tab inputs
  const [adminMobile, setAdminMobile] = useState('8602891120');
  const [adminPin, setAdminPin] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, adminLogin } = useAuth();
  const navigate = useNavigate();

  async function handleUserSubmit(e) {
    e.preventDefault();
    setError('');
    if (!mobile.trim() || !password) {
      setError('Please enter mobile number and password');
      return;
    }
    setSubmitting(true);
    try {
      await login(mobile.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdminSubmit(e) {
    e.preventDefault();
    setError('');
    if (!adminMobile.trim() || !adminPin.trim()) {
      setError('Please enter your owner phone number and 4-digit PIN');
      return;
    }
    setSubmitting(true);
    try {
      await adminLogin(adminMobile.trim(), adminPin.trim());
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid Owner PIN or credentials');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bw-page auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">Tickets</Link>
        <h1 className="auth-title">
          {activeTab === 'admin' ? 'Owner Portal' : 'Welcome back'}
        </h1>
        <p className="auth-subtitle">
          {activeTab === 'admin'
            ? 'Administrative sign-in for Saksham Pathak'
            : 'Login to your account'}
        </p>

        {/* Tab Selector */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === 'user' ? 'is-active' : ''}`}
            onClick={() => { setActiveTab('user'); setError(''); }}
          >
            User Login
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'admin' ? 'is-active' : ''}`}
            onClick={() => { setActiveTab('admin'); setError(''); }}
          >
            Owner Portal
          </button>
        </div>

        {/* USER LOGIN FORM */}
        {activeTab === 'user' && (
          <form className="auth-form" onSubmit={handleUserSubmit}>
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button className="bw-btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Login'}
            </button>
          </form>
        )}

        {/* OWNER PORTAL FORM */}
        {activeTab === 'admin' && (
          <form className="auth-form" onSubmit={handleAdminSubmit}>
            <label className="auth-label">
              Owner Mobile Number
              <div className="auth-phone-wrap">
                <span className="auth-phone-prefix">+91</span>
                <input
                  className="bw-input auth-phone-input"
                  type="tel"
                  placeholder="8602891120"
                  value={adminMobile}
                  onChange={(e) => setAdminMobile(e.target.value)}
                  maxLength={10}
                />
              </div>
            </label>

            <label className="auth-label">
              4-Digit Owner PIN
              <div className="auth-pw-wrap">
                <input
                  className="bw-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter 4-digit PIN"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  autoFocus
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button className="bw-btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Authenticating Owner…' : 'Sign in as Owner'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          {activeTab === 'user' ? (
            <>Don't have an account? <Link to="/signup">Sign up</Link></>
          ) : (
            <>Need a consumer account? <span className="auth-link-text" onClick={() => setActiveTab('user')}>Switch to User</span></>
          )}
        </p>
      </div>
    </div>
  );
}
