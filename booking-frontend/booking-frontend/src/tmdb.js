const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMAGE_THUMB = 'https://image.tmdb.org/t/p/w92';
const TMDB_PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';
const TMDB_IMAGE_BACKDROP = 'https://image.tmdb.org/t/p/w1280';

const headers = {
  accept: 'application/json',
  Authorization: `Bearer ${import.meta.env.VITE_TMDB_READ_TOKEN}`,
};

async function tmdbGet(path) {
  const res = await fetch(`${TMDB_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`TMDb request failed: ${res.status}`);
  return res.json();
}

export async function fetchMovie(movieId) {
  const [details, credits, releaseDates] = await Promise.all([
    tmdbGet(`/movie/${movieId}`),
    tmdbGet(`/movie/${movieId}/credits`),
    tmdbGet(`/movie/${movieId}/release_dates`),
  ]);

  const usCert = releaseDates.results
    ?.find((r) => r.iso_3166_1 === 'US')
    ?.release_dates?.find((rd) => rd.certification)?.certification;

  return {
    title: details.title,
    rating: details.vote_average ? `${details.vote_average.toFixed(1)}/10` : 'N/A',
    votes: details.vote_count ? `${formatVotes(details.vote_count)} Votes` : '',
    runtime: formatRuntime(details.runtime),
    genres: details.genres?.map((g) => g.name) ?? [],
    languages: (details.spoken_languages ?? []).map((l) => l.english_name || l.name).filter(Boolean),
    certification: usCert || 'NR',
    synopsis: details.overview || 'No synopsis available.',
    posterUrl: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : null,
    cast: (credits.cast ?? []).slice(0, 6).map((c) => ({
      name: c.name,
      role: c.character,
      photoUrl: c.profile_path ? `${TMDB_PROFILE_BASE}${c.profile_path}` : null,
    })),
    crew: (credits.crew ?? [])
      .filter((c) => ['Director', 'Writer', 'Screenplay', 'Producer'].includes(c.job))
      .slice(0, 5)
      .map((c) => ({
        name: c.name,
        role: c.job,
        photoUrl: c.profile_path ? `${TMDB_PROFILE_BASE}${c.profile_path}` : null,
      })),
  };
}

export async function searchMovies(query) {
  if (!query.trim()) return [];
  const data = await tmdbGet(`/search/movie?query=${encodeURIComponent(query)}`);
  return (data.results ?? []).slice(0, 6).map((m) => ({
    id: m.id,
    title: m.title,
    year: m.release_date ? m.release_date.slice(0, 4) : '',
    posterThumb: m.poster_path ? `${TMDB_IMAGE_THUMB}${m.poster_path}` : null,
  }));
}

function formatRuntime(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatVotes(count) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
  return String(count);
}

// ── Genre ID → name lookup (TMDb genre IDs are stable) ──────────
const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
};

function languageName(code) {
  const map = {
    en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
    ml: 'Malayalam', kn: 'Kannada', mr: 'Marathi', bn: 'Bengali',
    pa: 'Punjabi', gu: 'Gujarati', ko: 'Korean', ja: 'Japanese',
    fr: 'French', es: 'Spanish', de: 'German', it: 'Italian',
    pt: 'Portuguese', zh: 'Chinese', ru: 'Russian',
  };
  return map[code] || code?.toUpperCase() || '';
}

// ── Homepage: Hero carousel (trending movies with full details) ──
export async function fetchTrending() {
  const data = await tmdbGet('/trending/movie/week');
  const top5 = (data.results ?? []).slice(0, 5);

  const detailed = await Promise.all(
    top5.map(async (m) => {
      try {
        const [details, releaseDates] = await Promise.all([
          tmdbGet(`/movie/${m.id}`),
          tmdbGet(`/movie/${m.id}/release_dates`),
        ]);

        // Try Indian certification first, fall back to US
        const cert =
          releaseDates.results
            ?.find((r) => r.iso_3166_1 === 'IN')
            ?.release_dates?.find((rd) => rd.certification)?.certification ||
          releaseDates.results
            ?.find((r) => r.iso_3166_1 === 'US')
            ?.release_dates?.find((rd) => rd.certification)?.certification ||
          'NR';

        return {
          id: m.id,
          title: details.title || m.title,
          posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
          backdropUrl: m.backdrop_path ? `${TMDB_IMAGE_BACKDROP}${m.backdrop_path}` : null,
          certification: cert,
          genres: (details.genres ?? []).slice(0, 3).map((g) => g.name),
          synopsis: details.overview || '',
          language: languageName(details.original_language),
          rating: m.vote_average ? m.vote_average.toFixed(1) : null,
        };
      } catch {
        // If enrichment fails, return basic info from the list response
        return {
          id: m.id,
          title: m.title,
          posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
          backdropUrl: m.backdrop_path ? `${TMDB_IMAGE_BACKDROP}${m.backdrop_path}` : null,
          certification: 'NR',
          genres: (m.genre_ids ?? []).slice(0, 3).map((id) => GENRE_MAP[id] || '').filter(Boolean),
          synopsis: m.overview || '',
          language: languageName(m.original_language),
          rating: m.vote_average ? m.vote_average.toFixed(1) : null,
        };
      }
    })
  );

  return detailed;
}

// ── Homepage: Movie grid (now playing in India) ─────────────────
export async function fetchNowPlaying() {
  const [page1, page2] = await Promise.all([
    tmdbGet('/movie/now_playing?region=IN&page=1'),
    tmdbGet('/movie/now_playing?region=IN&page=2').catch(() => ({ results: [] })),
  ]);

  const all = [...(page1.results ?? []), ...(page2.results ?? [])];
  // Deduplicate by ID
  const unique = Array.from(new Map(all.map((m) => [m.id, m])).values());

  return unique.map((m) => ({
    id: m.id,
    title: m.title,
    posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : null,
    language: languageName(m.original_language),
    originalLanguage: m.original_language,
    releaseDate: m.release_date || '',
    genres: (m.genre_ids ?? []).slice(0, 2).map((id) => GENRE_MAP[id] || '').filter(Boolean),
    rating: m.vote_average ? m.vote_average.toFixed(1) : null,
  }));
}