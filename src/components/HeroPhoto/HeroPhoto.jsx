import "./HeroPhoto.css";

/**
 * Rounded photo with a gold offset shadow for the right side of a page banner,
 * matching the Caregiver Support and Education & Events banners (SCRUM-249).
 * Optional children sit on the photo as a small card, like Caregiver's caption.
 */
function HeroPhoto({ src, alt, children }) {
  return (
    <figure className="hero-photo">
      <img src={src} alt={alt} loading="eager" decoding="async" />
      {children && <figcaption className="hero-photo-card">{children}</figcaption>}
    </figure>
  );
}

/** Two-column banner layout: text on the left, photo on the right. */
export function HeroWithPhoto({ photo, children }) {
  return (
    <div className="hero-with-photo">
      <div className="hero-with-photo-copy">{children}</div>
      {photo}
    </div>
  );
}

export default HeroPhoto;
