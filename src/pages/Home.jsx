import PublishedRecords from "../components/PublishedRecords";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

import "./Home.css";

import HeroSlideshow from "../components/HeroSlideshow/HeroSlideshow";
import FadeIn from "../components/FadeIn/FadeIn";
import Statistics from "../components/Statistics/Statistics";

function Home() {
  const { t } = useLanguage();
  const h = t.home;

  return (
    <main className="home-page">
      <PublishedRecords kind="content_pages" slug="home" title="Project updates" />
      {/* =====================================================
          ROW 1 — HERO
      ====================================================== */}
      <section className="hero-section">
        <HeroSlideshow />

        <div className="section-container hero-layout">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              {h.eyebrow}
            </span>

            <h1>
              {h.title}
            </h1>

            <div className="hero-phase-line">
              <span>{h.phase}</span>
              <span className="hero-phase-dot">•</span>
              <span>{h.phaseTheme}</span>
            </div>

            <p className="hero-project-theme">
              {h.projectTheme}
            </p>

            <p className="hero-description">
              {h.description}
            </p>

            <div className="hero-actions">
              <a
                href="#visitor-pathways"
                className="hero-btn hero-btn-primary"
              >
                {h.findPath}
              </a>

              <Link
                to="/understand-dementia"
                className="hero-btn hero-btn-secondary"
              >
                {h.understandDementia}
              </Link>
            </div>

            <div className="hero-help-line">
              <span className="hero-help-dot" />

              <div>
                <strong>
                  {h.notSure}
                </strong>

                <a href="#visitor-pathways">
                  {h.tellUs}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ROW 2 — WHAT BRINGS YOU HERE?
      ====================================================== */}
      <section
        className="visitor-pathways-section"
        id="visitor-pathways"
      >
        <div className="section-container">
          <FadeIn>
            <div className="home-heading centred-heading">
              <span className="home-section-number">
                {h.pathwaysSectionNum}
              </span>

              <span className="home-section-label">
                {h.pathwaysSectionLabel}
              </span>

              <h2>
                {h.pathwaysHeading}
              </h2>

              <p>
                {h.pathwaysSubheading}
              </p>
            </div>
          </FadeIn>

          <div className="visitor-pathways-grid">
            <FadeIn delay={0}>
              <Link
                to="/understand-dementia"
                className="visitor-card visitor-card-purple"
              >
                <div className="visitor-card-header">
                  <span className="visitor-card-number">
                    {h.pathway1.number}
                  </span>

                  <span className="visitor-card-arrow">
                    ↗
                  </span>
                </div>

                <div className="visitor-card-icon">
                  ?
                </div>

                <h3>
                  {h.pathway1.title}
                </h3>

                <p>
                  {h.pathway1.desc}
                </p>

                <span className="visitor-card-link">
                  {h.pathway1.link}
                  <span>→</span>
                </span>
              </Link>
            </FadeIn>

            <FadeIn delay={100}>
              <Link
                to="/find-help"
                className="visitor-card visitor-card-green"
              >
                <div className="visitor-card-header">
                  <span className="visitor-card-number">
                    {h.pathway2.number}
                  </span>

                  <span className="visitor-card-arrow">
                    ↗
                  </span>
                </div>

                <div className="visitor-card-icon">
                  +
                </div>

                <h3>
                  {h.pathway2.title}
                </h3>

                <p>
                  {h.pathway2.desc}
                </p>

                <span className="visitor-card-link">
                  {h.pathway2.link}
                  <span>→</span>
                </span>
              </Link>
            </FadeIn>

            <FadeIn delay={200}>
              <Link
                to="/caregiver-support"
                className="visitor-card visitor-card-gold"
              >
                <div className="visitor-card-header">
                  <span className="visitor-card-number">
                    {h.pathway3.number}
                  </span>

                  <span className="visitor-card-arrow">
                    ↗
                  </span>
                </div>

                <div className="visitor-card-icon">
                  ♡
                </div>

                <h3>
                  {h.pathway3.title}
                </h3>

                <p>
                  {h.pathway3.desc}
                </p>

                <span className="visitor-card-link">
                  {h.pathway3.link}
                  <span>→</span>
                </span>
              </Link>
            </FadeIn>

            <FadeIn delay={300}>
              <Link
                to="/learn-events"
                className="visitor-card visitor-card-blue"
              >
                <div className="visitor-card-header">
                  <span className="visitor-card-number">
                    {h.pathway4.number}
                  </span>

                  <span className="visitor-card-arrow">
                    ↗
                  </span>
                </div>

                <div className="visitor-card-icon">
                  ▶
                </div>

                <h3>
                  {h.pathway4.title}
                </h3>

                <p>
                  {h.pathway4.desc}
                </p>

                <span className="visitor-card-link">
                  {h.pathway4.link}
                  <span>→</span>
                </span>
              </Link>
            </FadeIn>
          </div>

          <FadeIn delay={350}>
            <p className="pathways-note">
              {h.pathwaysNote}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* =====================================================
          ROW 3 — STATISTICS
      ====================================================== */}
      <Statistics />
    </main>
  );
}

export default Home;