import PublishedRecords from "../components/PublishedRecords";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

import "./Home.css";

import HeroSlideshow from "../components/HeroSlideshow/HeroSlideshow";
import FadeIn from "../components/FadeIn/FadeIn";
import { openWelcomeGuide } from "../components/WelcomeGuide/openWelcomeGuide";
import Statistics from "../components/Statistics/Statistics";

// Simple line icons for the four pathway cards.
const ICON_PATHS = {
  understand: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14" />
      <path d="M12 17.5h.01" />
    </>
  ),
  help: (
    <>
      <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z" />
      <path d="M12 9v5M9.5 11.5h5" />
    </>
  ),
  caring: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20c.6-3.4 3-5.5 6-5.5 1.3 0 2.5.4 3.4 1.1" />
      <path d="M17 20s-4-2.4-4-5.2a2 2 0 0 1 4-.8 2 2 0 0 1 4 .8C21 17.6 17 20 17 20Z" />
    </>
  ),
  learn: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="m10 9 5 2-5 2V9Z" />
      <path d="M8 21h8" />
    </>
  ),
};

function PathwayIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

const PATHWAYS = [
  { key: "pathway1", to: "/understand-dementia", icon: "understand", tone: "purple" },
  { key: "pathway2", to: "/find-help", icon: "help", tone: "gold" },
  { key: "pathway3", to: "/caregiver-support", icon: "caring", tone: "lilac" },
  { key: "pathway4", to: "/learn-events", icon: "learn", tone: "cream" },
];

function Home() {
  const { t } = useLanguage();
  const h = t.home;

  return (
    <main className="home-page">
      <PublishedRecords kind="content_pages" slug="home" title={t.inlineCopy.projectUpdates} />

      {/* HERO: one message, one main button */}
      <section className="hero-section">
        <HeroSlideshow />

        <div className="section-container hero-layout">
          <div className="hero-copy">
            <span className="hero-eyebrow">{h.eyebrow}</span>

            <h1>{h.title}</h1>

            <div className="hero-phase-line">
              <span>{h.phase}</span>
              <span className="hero-phase-dot">•</span>
              <span>{h.phaseTheme}</span>
            </div>

            <p className="hero-project-theme">{h.projectTheme}</p>

            <p className="hero-description">{h.description}</p>

            <div className="hero-actions">
              <button
                type="button"
                className="hero-btn hero-btn-primary"
                onClick={openWelcomeGuide}
              >
                {t.welcomeGuide.reopen} →
              </button>

              <a href="#visitor-pathways" className="hero-btn hero-btn-secondary">
                {h.browseTopics}
              </a>
            </div>

            <ul className="hero-facts">
              <li>{h.facts.free}</li>
              <li>{h.facts.languages}</li>
              <li>{h.facts.information}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* WHAT BRINGS YOU HERE? */}
      <section className="visitor-pathways-section" id="visitor-pathways">
        <div className="section-container">
          <FadeIn>
            <div className="home-heading centred-heading">
              <span className="home-section-label">{h.pathwaysSectionLabel}</span>
              <h2>{h.pathwaysHeading}</h2>
              <p>{h.pathwaysSubheading}</p>
            </div>
          </FadeIn>

          <div className="visitor-pathways-grid">
            {PATHWAYS.map(({ key, to, icon, tone }, index) => (
              <FadeIn key={key} delay={index * 100}>
                <Link to={to} className={`visitor-card visitor-card-${tone}`}>
                  <div className="visitor-card-header">
                    <span className="visitor-card-icon">
                      <PathwayIcon name={icon} />
                    </span>
                    <span className="visitor-card-arrow" aria-hidden="true">↗</span>
                  </div>

                  <h3>{h[key].title}</h3>
                  <p>{h[key].desc}</p>

                  <span className="visitor-card-link">
                    {h[key].link}
                    <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <Statistics />
    </main>
  );
}

export default Home;