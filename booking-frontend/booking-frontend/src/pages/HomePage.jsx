import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { fetchTrending, fetchNowPlaying } from '../tmdb';
import { useAuth } from '../AuthContext';
import '../theme.css';
import './HomePage.css';

export default function HomePage() {
  const [trending, setTrending] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    Promise.all([fetchTrending(), fetchNowPlaying()])
      .then(([t, np]) => {
        setTrending(t);
        setNowPlaying(np);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-rotate hero every 6 seconds
  useEffect(() => {
    if (trending.length === 0) return;
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % trending.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [trending.length]);

  const hero = trending[heroIndex];

  // Filter and sort movies according to selected pill
  const displayedMovies = useMemo(() => {
    let list = [...nowPlaying];
    if (activeFilter === 'Hindi') {
      list = list.filter((m) => m.language === 'Hindi' || m.originalLanguage === 'hi');
    } else if (activeFilter === 'English') {
      list = list.filter((m) => m.language === 'English' || m.originalLanguage === 'en');
    } else if (activeFilter === 'New Releases') {
      list = list.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
    }
    return list;
  }, [nowPlaying, activeFilter]);

  function goToMovie(movieId) {
    navigate(`/movie/${movieId}`);
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

      {/* Hero Carousel */}
      {hero && (
        <section className="hero-section">
          <div
            className="hero-backdrop"
            style={hero.backdropUrl ? { backgroundImage: `url(${hero.backdropUrl})` } : {}}
          >
            <div className="hero-overlay" />
            <div className="hero-content">
              <div className="hero-text">
                <h1 className="hero-title">{hero.title}</h1>
                <div className="hero-meta">
                  <span className="hero-cert">{hero.certification}</span>
                  <span className="hero-divider">|</span>
                  {hero.genres.map((g, i) => (
                    <span key={g}>
                      {g}
                      {i < hero.genres.length - 1 && <span className="hero-divider">, </span>}
                    </span>
                  ))}
                </div>
                <p className="hero-synopsis">
                  {hero.synopsis?.slice(0, 200)}
                  {hero.synopsis?.length > 200 ? '…' : ''}
                </p>
                <button className="bw-btn-primary" onClick={() => goToMovie(hero.id)}>
                  Book now
                </button>
              </div>
              {hero.posterUrl && (
                <img src={hero.posterUrl} alt={hero.title} className="hero-poster" />
              )}
            </div>

            {/* Navigation arrows */}
            <button
              className="hero-arrow hero-arrow-left"
              onClick={() => setHeroIndex((i) => (i - 1 + trending.length) % trending.length)}
              aria-label="Previous movie"
            >
              ‹
            </button>
            <button
              className="hero-arrow hero-arrow-right"
              onClick={() => setHeroIndex((i) => (i + 1) % trending.length)}
              aria-label="Next movie"
            >
              ›
            </button>
          </div>

          {/* Dots */}
          <div className="hero-dots">
            {trending.map((_, i) => (
              <button
                key={i}
                className={`hero-dot ${i === heroIndex ? 'is-active' : ''}`}
                onClick={() => setHeroIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Now in Theatres Grid */}
      <main className="home-main">
        <h2 className="home-section-title">Now in Theatres</h2>

        <div className="filter-row">
          {['All', 'Hindi', 'English', 'New Releases'].map((tab) => (
            <button
              key={tab}
              className={`filter-btn ${activeFilter === tab ? 'filter-active' : ''}`}
              onClick={() => setActiveFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="home-loading">Loading movies…</p>
        ) : displayedMovies.length === 0 ? (
          <p className="home-loading">No movies found for {activeFilter}.</p>
        ) : (
          <div className="movie-grid">
            {displayedMovies.map((movie) => (
              <div className="movie-card" key={movie.id} onClick={() => goToMovie(movie.id)}>
                {movie.posterUrl ? (
                  <img src={movie.posterUrl} alt={movie.title} className="movie-card-poster" loading="lazy" />
                ) : (
                  <div className="movie-card-poster movie-card-empty" />
                )}
                <div className="movie-card-info">
                  <div className="movie-card-title">{movie.title}</div>
                  <div className="movie-card-meta">
                    {movie.genres.length > 0 && (
                      <span className="movie-card-genre">{movie.genres[0]}</span>
                    )}
                    {movie.language && (
                      <span className="movie-card-lang">{movie.language}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
