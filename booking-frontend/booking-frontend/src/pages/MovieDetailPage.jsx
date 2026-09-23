import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LanguageFormatModal from '../components/LanguageFormatModal';
import SearchBar from '../components/SearchBar';
import { useAuth } from '../AuthContext';
import { fetchMovie } from '../tmdb';
import '../theme.css';
import './MovieDetailPage.css';

// Interstellar (2014) is the default when no specific movie is chosen
// (i.e. when visiting "/movie" directly rather than "/movie/:movieId"
// from a search result).
const DEFAULT_MOVIE_ID = 157336;

export default function MovieDetailPage() {
  const { movieId } = useParams();
  const effectiveId = movieId || DEFAULT_MOVIE_ID;

  const [movie, setMovie] = useState(null);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    setMovie(null);
    setError(null);
    fetchMovie(effectiveId)
      .then(setMovie)
      .catch(() => setError('Could not load movie data from TMDb. Check your API key in .env.'));
  }, [effectiveId]);

  function handleFormatSelected(language, format) {
    setModalOpen(false);
    navigate(`/showtimes?language=${encodeURIComponent(language)}&format=${encodeURIComponent(format)}&movie=${encodeURIComponent(movie.title)}&movieId=${effectiveId}`);
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

      <main className="detail-main">
        {error && <p className="detail-error">{error}</p>}

        {!error && !movie && <p className="detail-loading">Loading movie details…</p>}

        {movie && (
          <>
            <div className="detail-hero">
              {movie.posterUrl ? (
                <img className="poster-image" src={movie.posterUrl} alt={`${movie.title} poster`} />
              ) : (
                <div className="poster-placeholder" aria-hidden="true">
                  <div className="poster-glow" />
                  <span className="poster-initial">{initialsOf(movie.title)}</span>
                </div>
              )}

              <div className="detail-info">
                <h1 className="detail-title">{movie.title}</h1>

                <div className="detail-meta">
                  <span className="rating">★ {movie.rating}</span>
                  <span className="dot">·</span>
                  <span>{movie.votes}</span>
                </div>

                <div className="detail-tags">
                  {movie.runtime && <span className="bw-tag">{movie.runtime}</span>}
                  <span className="bw-tag">{movie.certification}</span>
                  {movie.genres.map((g) => (
                    <span className="bw-tag" key={g}>{g}</span>
                  ))}
                </div>

                <button className="bw-btn-primary book-btn" onClick={() => setModalOpen(true)}>
                  Book tickets
                </button>
              </div>
            </div>

            <section className="detail-section">
              <h2>About the movie</h2>
              <p className="synopsis">{movie.synopsis}</p>
            </section>

            {movie.cast.length > 0 && (
              <section className="detail-section">
                <h2>Cast</h2>
                <div className="people-scroll">
                  {movie.cast.map((p) => (
                    <PersonCard key={p.name} {...p} />
                  ))}
                </div>
              </section>
            )}

            {movie.crew.length > 0 && (
              <section className="detail-section">
                <h2>Crew</h2>
                <div className="people-scroll">
                  {movie.crew.map((p) => (
                    <PersonCard key={p.name} {...p} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {modalOpen && (
        <LanguageFormatModal movieTitle={movie.title} languages={movie.languages} onClose={() => setModalOpen(false)} onSelect={handleFormatSelected} />
      )}
    </div>
  );
}

function initialsOf(title) {
  return title
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function PersonCard({ name, role, photoUrl }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="person-card">
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="person-photo" />
      ) : (
        <div className="person-avatar">{initials}</div>
      )}
      <div className="person-name">{name}</div>
      <div className="person-role">{role}</div>
    </div>
  );
}