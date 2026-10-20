import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import "./Footer.css";

function Footer() {
  const { language, setLanguage, t, languages, currentLanguageConfig } =
    useLanguage();
  const f = t.footer;
  const m = t.header.menu;

  const cycleLanguage = () => {
    const currentIndex = languages.findIndex((l) => l.code === language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex].code);
  };

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-eyebrow">{f.eyebrow}</span>

            <h2>{f.title}</h2>

            <p>{f.desc}</p>
          </div>

          <div className="footer-links-group">
            <h3>{f.explore}</h3>
            <Link to="/get-updated">{f.getUpdated}</Link>
            <Link to="/caregiver-support/verify-certificate">
              {f.verifyCert}
            </Link>

            <Link to="/understand-dementia">{m.understand}</Link>

            <Link to="/find-help">{m.findHelp}</Link>

            <Link to="/caregiver-support">{m.caregiverSupport}</Link>

            <Link to="/learn-events">{m.learnEvents}</Link>
          </div>

          <div className="footer-links-group">
            <h3>{f.about}</h3>

            <Link to="/about">{m.aboutProject}</Link>

            <Link to="/about/contact">{m.contactUs}</Link>

            <Link to="/about/locations">{m.locations}</Link>

            <Link to="/about/support">{m.supportProject}</Link>
          </div>

          <div className="footer-contact">
            <h3>{f.guidanceTitle}</h3>

            <p>{f.guidanceDesc}</p>

            <Link to="/about/contact" className="footer-contact-button">
              {f.contactBtn}
            </Link>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <div>
            <strong>{f.organisation}</strong>

            <span>{f.tagline}</span>
          </div>

          <div className="footer-bottom-links">
            <button
              type="button"
              onClick={cycleLanguage}
              title="Click to switch language"
            >
              {currentLanguageConfig.nativeLabel}
            </button>

            <span>
              © {new Date().getFullYear()} {f.rights}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;