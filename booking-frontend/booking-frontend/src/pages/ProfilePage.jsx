import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../theme.css';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn || !user) return null;

  function handleLogout() {
    logout();
    navigate('/');
  }

  const initial = user.name?.[0]?.toUpperCase() || 'U';

  return (
    <div className="bw-page">
      <header className="profile-header">
        <Link to="/" className="bw-back">← Profile</Link>
      </header>

      <main className="profile-main">
        {/* User info card */}
        <div className="profile-user-section">
          <div className="profile-avatar">{initial}</div>
          <div className="profile-user-info">
            <div className="profile-name">{user.name}</div>
            <div className="profile-phone">+91 {user.mobileNumber}</div>
          </div>
        </div>

        {/* Bookings */}
        <div className="profile-menu-group">
          <button className="profile-menu-item" onClick={() => navigate('/')}>
            <span className="profile-menu-icon">📋</span>
            <span className="profile-menu-text">View all bookings</span>
            <span className="profile-menu-chevron">›</span>
          </button>
        </div>

        {/* Support */}
        <div className="profile-menu-label">Support</div>
        <div className="profile-menu-group">
          <button className="profile-menu-item">
            <span className="profile-menu-icon">💬</span>
            <span className="profile-menu-text">Chat with us</span>
            <span className="profile-menu-chevron">›</span>
          </button>
        </div>

        {/* More */}
        <div className="profile-menu-label">More</div>
        <div className="profile-menu-group">
          <button className="profile-menu-item">
            <span className="profile-menu-icon">📄</span>
            <span className="profile-menu-text">Terms & Conditions</span>
            <span className="profile-menu-chevron">›</span>
          </button>
          <div className="profile-menu-divider" />
          <button className="profile-menu-item">
            <span className="profile-menu-icon">🔒</span>
            <span className="profile-menu-text">Privacy Policy</span>
            <span className="profile-menu-chevron">›</span>
          </button>
        </div>

        {/* Logout */}
        <div className="profile-menu-group profile-logout">
          <button className="profile-menu-item" onClick={handleLogout}>
            <span className="profile-menu-icon">🚪</span>
            <span className="profile-menu-text">Logout</span>
          </button>
        </div>
      </main>
    </div>
  );
}
