import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import "./SearchOverlay.css";
import { searchItems } from "./searchItems";
import { rankSearch, publicSearchItems } from "../../../shared/site-search";
import { lockDialogScroll } from "../dialogScroll";


function SearchOverlay({ isOpen, onClose }) {
  const { t, translateContent } = useLanguage();
  const s = t.search;
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const [remoteItems, setRemoteItems] = useState([]);
  const [partial, setPartial] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const sources = ['/api/activities', '/api/public/organisations', '/api/public/learning_resources'];
    Promise.allSettled(sources.map(async url => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw Error('Search source unavailable');
      const data = await response.json();
      if (!Array.isArray(data)) throw Error('Invalid search source');
      return data;
    })).then(results => {
      if (controller.signal.aborted) return;
      setPartial(results.some(result => result.status === 'rejected'));
      setRemoteItems(publicSearchItems(...results.map(result => result.status === 'fulfilled' ? result.value : [])));
    });
    return () => controller.abort();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previous = document.activeElement;
    const unlock = lockDialogScroll();
    const dialog = dialogRef.current;
    dialog?.showModal();
    inputRef.current?.focus();
    return () => {
      dialog?.close();
      unlock();
      previous?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  const results = useMemo(() => rankSearch([
    ...translateContent(searchItems, 'search/pages'),
    ...translateContent(remoteItems, 'search/content'),
  ], query), [query, remoteItems, translateContent]);
  useEffect(() => {
    const timer = setTimeout(() => setAnnouncement(query.trim() ? `${results.length} ${results.length === 1 ? s.result : s.results}` : ''), 300);
    return () => clearTimeout(timer);
  }, [query, results.length, s.result, s.results]);

  if (!isOpen) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="search-overlay"
      onCancel={event => { event.preventDefault(); onClose(); }}
      aria-label="Search website"
    >
      <button
        className="search-backdrop"
        onClick={onClose}
        aria-label="Close search"
        tabIndex={-1}
      />

      <div className="search-panel">
        <div className="search-panel-top">
          <div>
            <span className="search-label">{s.label}</span>
            <h2>{s.heading}</h2>
          </div>

          <button
            className="search-close"
            onClick={onClose}
            aria-label="Close search"
          >
            ×
          </button>
        </div>

        <label htmlFor="site-search-input">{s.label}</label>
        <p className="search-status" role="status">{announcement}</p>
        {partial && <p>Some event or resource results are unavailable. Page search is still available.</p>}
        <div className="search-input-wrapper">
          <span className="search-icon">⌕</span>

          <input
            id="site-search-input"
            ref={inputRef}
            type="search"
            placeholder={s.placeholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Escape' || event.nativeEvent.isComposing) return;
              // Chromium otherwise clears a filled search input before dismissing the dialog.
              event.preventDefault();
              onClose();
            }}
            aria-label="Search website"
          />

          {query && (
            <button
              className="search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              {s.clear}
            </button>
          )}
        </div>

        {!query && (
          <div className="search-suggestions">
            <p>{s.popular}</p>

            <div className="suggestion-buttons">
              <button onClick={() => setQuery("dementia")}>
                {s.tagDementia || "Dementia"}
              </button>

              <button onClick={() => setQuery("caregiver")}>
                {s.tagCaregiver || "Caregiver Support"}
              </button>

              <button onClick={() => setQuery("healthcare")}>
                {s.tagHealthcare || "Healthcare"}
              </button>

              <button onClick={() => setQuery("events")}>
                {s.tagEvents || "Events"}
              </button>
            </div>
          </div>
        )}

        {query && (
          <div className="search-results">
            <div className="search-results-heading">
              <span>
                {results.length}{" "}
                {results.length === 1 ? s.result : s.results}
              </span>
            </div>

            {results.length > 0 ? (
              <div className="search-results-list">
                {results.map((item) => (
                  <Link
                    key={item.id || item.path}
                    to={item.path}
                    className="search-result"
                    onClick={onClose}
                  >
                    <div>
                      <span className="search-result-category">
                        {item.category}
                      </span>

                      <h3>{item.title}</h3>

                      <p>{item.description}</p>
                    </div>

                    <span className="search-result-arrow">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="search-empty">
                <h3>{s.noResults}</h3>

                <p>{s.noResultsDesc}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}

export default SearchOverlay;
