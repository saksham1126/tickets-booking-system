import '../theme.css';
import './LanguageFormatModal.css';

// TMDb tells us which language(s) a movie is actually in, so we only
// show those - a Hindi-only film like "Hanuman Ansh" now correctly shows
// just Hindi instead of always offering English too.
//
// Formats (2D/3D/IMAX/4DX) are NOT something any public movie database
// tracks - that's a cinema chain's own exhibition inventory, not movie
// metadata - so this stays a fixed generic set applied to whichever
// real language(s) the movie has. There's no API anywhere (free or
// paid) that has genuine per-movie format availability.
const GENERIC_FORMATS = ['2D', '3D'];

export default function LanguageFormatModal({ movieTitle, languages, onClose, onSelect }) {
  const realLanguages = languages && languages.length > 0 ? languages : ['English'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">{movieTitle}</div>
            <h2>Select language and format</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          {realLanguages.map((language) => (
            <div className="language-group" key={language}>
              <div className="language-label">{language}</div>
              <div className="format-pills">
                {GENERIC_FORMATS.map((format) => (
                  <button
                    key={format}
                    className="format-pill"
                    onClick={() => onSelect(language, format)}
                  >
                    {format}
                  </button>
                ))}
                <button
                  className="format-pill format-pill-all"
                  onClick={() => onSelect(language, 'All')}
                >
                  Select all
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}