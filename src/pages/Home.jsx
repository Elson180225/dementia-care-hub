import PublishedRecords from "../components/PublishedRecords";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

import "./Home.css";

import HeroSlideshow from "../components/HeroSlideshow/HeroSlideshow";
import FadeIn from "../components/FadeIn/FadeIn";
import { openWelcomeGuide } from "../components/WelcomeGuide/openWelcomeGuide";
import Statistics from "../components/Statistics/Statistics";
import Marquee from "../components/Marquee/Marquee";

import understandImage from "../assets/understand-dementia.jpg";
import helpImage from "../assets/healthcare-support.jpg";
import caringImage from "../assets/caregiver-support.jpg";
import learnImage from "../assets/learning-events.jpg";

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
  { key: "pathway1", to: "/understand-dementia", icon: "understand", image: understandImage },
  { key: "pathway2", to: "/find-help", icon: "help", image: helpImage },
  { key: "pathway3", to: "/caregiver-support", icon: "caring", image: caringImage },
  { key: "pathway4", to: "/learn-events", icon: "learn", image: learnImage },
];

function Home() {
  const { t, translateLabel } = useLanguage();
  const h = t.home;
  const [active, setActive] = useState(0);
  const current = PATHWAYS[active];
  const step = (by) => setActive((index) => (index + by + PATHWAYS.length) % PATHWAYS.length);

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

            {/* RCBC Home Draft 02: Find Your Path goes straight to the pathway cards. */}
            <div className="hero-actions">
              <a href="#visitor-pathways" className="hero-btn hero-btn-primary">
                {h.findYourPath} <span aria-hidden="true">↓</span>
              </a>

              <Link to="/understand-dementia" className="hero-btn hero-btn-secondary">
                {h.understandButton} <span aria-hidden="true">→</span>
              </Link>
            </div>

            <button type="button" className="hero-guide-link" onClick={openWelcomeGuide}>
              {h.notSureGuide}
            </button>

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

          {/* One large featured slide, with every pathway listed beside it */}
          <div className="pathway-showcase">
            <article
              className="pathway-stage"
              style={{ "--pathway-image": `url(${current.image})` }}
              aria-live="polite"
            >
              <span className="pathway-stage-number" aria-hidden="true">
                {String(active + 1).padStart(2, "0")}
              </span>
              <div className="pathway-stage-content" key={current.key}>
                <span className="visitor-card-icon">
                  <PathwayIcon name={current.icon} />
                </span>
                <h3>{h[current.key].title}</h3>
                <p>{h[current.key].desc}</p>
                <Link to={current.to} className="pathway-stage-link">
                  {h[current.key].link}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="pathway-stage-controls">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={translateLabel("Previous slide", "previousSlide")}
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={translateLabel("Next slide", "nextSlide")}
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>

            <ol className="pathway-list">
              {PATHWAYS.map(({ key, icon }, index) => (
                <li key={key}>
                  <button
                    type="button"
                    className={index === active ? "is-active" : ""}
                    aria-pressed={index === active}
                    onClick={() => setActive(index)}
                  >
                    <span className="pathway-list-number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="pathway-list-icon" aria-hidden="true">
                      <PathwayIcon name={icon} />
                    </span>
                    <span className="pathway-list-text">
                      <strong>{h[key].title}</strong>
                      <span>{h[key].desc}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <Marquee items={t.header.hubSubtitle.split("•").map((word) => word.trim())} />

      {/* STATISTICS */}
      <Statistics />
    </main>
  );
}

export default Home;