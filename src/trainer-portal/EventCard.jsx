import PortalIcon from "./PortalIcon";
import { fmtDate } from "./selectors";
import "./EventCards.css";

// Poster card for one activity, used by Events & learning and Completed workshops.
export default function EventCard({ activity: a, status, wide = false, children }) {
  const date = new Date(a.date);
  const month = date.toLocaleDateString("en-MY", { month: "short", timeZone: "Asia/Kuala_Lumpur" });
  const day = date.toLocaleDateString("en-MY", { day: "numeric", timeZone: "Asia/Kuala_Lumpur" });
  const photos = a.completion?.photos || [];
  const place = a.mode === "Online" ? "Online" : a.venue || a.city || "Venue to be confirmed";

  return (
    <li className={`ev-card${wide ? " is-wide" : ""}`}>
      <div className="ev-poster">
        {a.posterUrl
          ? <img src={a.posterUrl} alt={`Poster for ${a.title}`} loading="lazy" />
          : <div className="ev-poster-empty"><PortalIcon name="events" /><span>No poster yet</span></div>}
        {status && <span className="ev-status">{status}</span>}
        <span className="ev-date" aria-hidden="true"><small>{month}</small><strong>{day}</strong></span>
      </div>
      <div className="ev-body">
        <h3>{a.title}</h3>
        <p className="ev-meta">{a.type} · {place}</p>
        <p className="ev-meta">{fmtDate(a.date)}{a.language ? ` · ${a.language}` : ""}</p>
        {photos.length > 0 && (
          <div className="ev-photos">
            {photos.slice(0, 5).map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={`Activity photo ${i + 1}`} loading="lazy" />
              </a>
            ))}
          </div>
        )}
      </div>
      {children && <div className="ev-actions">{children}</div>}
    </li>
  );
}