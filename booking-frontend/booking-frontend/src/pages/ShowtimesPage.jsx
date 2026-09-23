import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { useAuth } from '../AuthContext';
import '../theme.css';
import './ShowtimesPage.css';

// Only "PVR Metro, Indore" is backed by real seeded data in this project
// (event_instance_id = 1). The other cinemas exist to demonstrate the
// layout with multiple venues, the way a real listings page would look,
// but their showtimes are intentionally shown as SOLD OUT since there's
// no real inventory behind them yet. Both of PVR Metro's showtimes route
// to the same real seat map, since that's the only event this backend
// currently has.
const CINEMAS = [
  {
    name: 'Tickets Cinema: Indore',
    real: true,
    showtimes: [
      { time: '7:00 PM', screen: 'CLASSIC', status: 'AVAILABLE' },
      { time: '9:45 PM', screen: 'CLASSIC', status: 'FAST_FILLING' },
    ],
  },
  {
    name: 'Cineplex: Treasure Mall, Indore',
    real: true,
    showtimes: [
      { time: '6:30 PM', screen: 'SCREEN 3', status: 'AVAILABLE' },
      { time: '9:15 PM', screen: 'SCREEN 3', status: 'FAST_FILLING' },
    ],
  },
  {
    name: 'Grand Screens: Phoenix Citadel',
    real: true,
    showtimes: [
      { time: '5:45 PM', screen: 'IMAX', status: 'AVAILABLE' },
      { time: '8:30 PM', screen: 'IMAX', status: 'FAST_FILLING' },
    ],
  },
];

export default function ShowtimesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(0);

  const language = searchParams.get('language') || 'English';
  const format = searchParams.get('format') || '2D';
  const movieName = searchParams.get('movie') || 'Movie';
  const movieId = searchParams.get('movieId') || '';

  const days = useMemo(() => buildNextSevenDays(), []);
  const { user, isLoggedIn } = useAuth();

  function handleShowtimeClick(cinema, showtime) {
    if (showtime.status === 'SOLD_OUT') return;
    const params = new URLSearchParams({
      movie: movieName,
      time: showtime.time,
      movieId: movieId,
      language: language,
      format: format,
      cinema: cinema.name,
      screen: showtime.screen,
    });
    navigate(`/seatmap?${params.toString()}`);
  }

  return (
    <div className="bw-page">
      <header className="bw-topbar">
        <Link to="/" className="bw-brand">Tickets</Link>
        <SearchBar />
        {isLoggedIn ? (
          <Link to="/profile" className="bw-profile-btn" title={user.name}>
            <span className="bw-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</span>
          </Link>
        ) : (
          <Link to="/login" className="bw-btn-outline bw-login-btn">Login</Link>
        )}
      </header>

      <main className="showtimes-main">
        <Link to={movieId ? `/movie/${movieId}` : '/'} className="bw-back">← {movieName}</Link>
        <h1 className="showtimes-title">
          {movieName} <span className="showtimes-subtitle">— ({language}, {format})</span>
        </h1>

        <div className="date-strip">
          {days.map((day, i) => (
            <button
              key={day.iso}
              className={`date-pill ${i === selectedDay ? 'is-selected' : ''}`}
              onClick={() => setSelectedDay(i)}
            >
              <span className="date-dow">{day.dow}</span>
              <span className="date-num">{day.date}</span>
              <span className="date-mon">{day.mon}</span>
            </button>
          ))}
        </div>

        <div className="legend-row">
          <LegendDot status="AVAILABLE" label="Available" />
          <LegendDot status="FAST_FILLING" label="Fast filling" />
          <LegendDot status="SOLD_OUT" label="Sold out" />
        </div>

        <div className="cinema-list">
          {CINEMAS.map((cinema) => (
            <div className="cinema-card" key={cinema.name}>
              <div className="cinema-name">
                {cinema.name}
                {cinema.real && <span className="live-tag">Live data</span>}
              </div>
              <div className="showtime-row">
                {cinema.showtimes.map((st) => (
                  <button
                    key={st.time}
                    className={`showtime-btn showtime-${st.status.toLowerCase()}`}
                    disabled={st.status === 'SOLD_OUT'}
                    onClick={() => handleShowtimeClick(cinema, st)}
                  >
                    <span className="showtime-time">{st.time}</span>
                    <span className="showtime-screen">{st.screen}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function LegendDot({ status, label }) {
  return (
    <div className="legend-dot-item">
      <span className={`legend-dot legend-dot-${status.toLowerCase()}`} />
      {label}
    </div>
  );
}

function buildNextSevenDays() {
  const days = [];
  const dowFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  const monFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      iso: d.toISOString().slice(0, 10),
      dow: dowFormatter.format(d).toUpperCase(),
      date: d.getDate(),
      mon: monFormatter.format(d).toUpperCase(),
    });
  }
  return days;
}
