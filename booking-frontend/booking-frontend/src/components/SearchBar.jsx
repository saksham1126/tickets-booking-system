import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMovies } from '../tmdb';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await searchMovies(query);
        setResults(found);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(movieId) {
    setOpen(false);
    setQuery('');
    navigate(`/movie/${movieId}`);
  }

  return (
    <div className="bw-search-wrap">
      <input
        className="bw-search-input"
        type="text"
        placeholder="Search for movies..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <div className="bw-search-results">
          {results.map((r) => (
            <button
              key={r.id}
              className="bw-search-result"
              onMouseDown={() => handleSelect(r.id)}
            >
              {r.posterThumb ? (
                <img src={r.posterThumb} alt="" className="bw-search-thumb" />
              ) : (
                <div className="bw-search-thumb bw-search-thumb-empty" />
              )}
              <span>{r.title} {r.year && <span className="bw-search-year">({r.year})</span>}</span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && results.length === 0 && (
        <div className="bw-search-message">No movies found for "{query}".</div>
      )}
    </div>
  );
}