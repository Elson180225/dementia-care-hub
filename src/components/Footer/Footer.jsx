import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import "./Footer.css";

// Global footer, as agreed in RCBC's Global Website Elements V1.0 (section 5):
// project identity, three link columns (Explore / About / Stay Updated),
// copyright and the Privacy Policy and Terms of Use links.
function Footer() {
  const { language, setLanguage, t, languages, currentLanguageConfig, translateLabel } =
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

            <p className="footer-initiative">{f.initiative}</p>
          </div>

          <div className="footer-links-group">
            <h3>{f.explore}</h3>

            <Link to="/understand-dementia">{m.understand}</Link>

            <Link to="/find-help">{m.findHelp}</Link>

            <Link to="/caregiver-support">{m.caregiverSupport}</Link>

            <Link to="/learn-events">{m.learnEvents}</Link>
          </div>

          <div className="footer-links-group">
            <h3>{f.about}</h3>

            <Link to="/about">{m.aboutProject}</Link>

            <Link to="/about/contact">{m.contactUs}</Link>
          </div>

          <div className="footer-links-group">
            <h3>{f.stayUpdated}</h3>

            <p className="footer-stay-desc">{f.stayUpdatedDesc}</p>

            <Link to="/get-updated">{f.getUpdated}</Link>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {f.rights}
          </span>

          <div className="footer-bottom-links">
            <Link to="/privacy-policy">{f.privacy}</Link>

            <span aria-hidden="true">|</span>

            <Link to="/terms-of-use">{f.terms}</Link>

            <button
              type="button"
              onClick={cycleLanguage}
              title={translateLabel("Click to switch language", "clickSwitchLanguage")}
            >
              {currentLanguageConfig.nativeLabel}
            </button>

            {/* Discreet entry for the RCBC project team; not promoted in the main navigation. */}
            <Link to="/admin" className="footer-admin-link">
              {f.adminAccess}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
