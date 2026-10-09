import { Link } from "react-router-dom";

import "./Home.css";

import HeroSlideshow from "../components/HeroSlideshow/HeroSlideshow";
import FadeIn from "../components/FadeIn/FadeIn";
import Statistics from "../components/Statistics/Statistics";

function Home() {
  return (
    <main className="home-page">
      {/* =====================================================
          ROW 1 — HERO
      ====================================================== */}

      <section className="hero-section">
  <HeroSlideshow />

  <div className="section-container hero-layout">
    <div className="hero-copy">
      <span className="hero-eyebrow">
        Alzheimer&apos;s Care Project by RCBC
      </span>

      <h1>
        Dementia Care Connect
      </h1>

      <div className="hero-phase-line">
        <span>Phase 2</span>
        <span className="hero-phase-dot">•</span>
        <span>Go Digital</span>
      </div>

      <p className="hero-project-theme">
        Understanding the Missing Pieces
      </p>

      <p className="hero-description">
        Find clear information, practical support and learning
        resources for people living with dementia, families,
        caregivers and the wider community.
      </p>

      <div className="hero-actions">
        <a
          href="#visitor-pathways"
          className="hero-btn hero-btn-primary"
        >
          Find Your Path
        </a>

        <Link
          to="/learn-events/dementia-education"
          className="hero-btn hero-btn-secondary"
        >
          Understand Dementia
        </Link>
      </div>

      <div className="hero-help-line">
        <span className="hero-help-dot" />

        <div>
          <strong>
            Not sure where to begin?
          </strong>

          <a href="#visitor-pathways">
            Tell us what brings you here →
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
                02
              </span>

              <span className="home-section-label">
                What Brings You Here?
              </span>

              <h2>
                Tell us what you need.
              </h2>

              <p>
                Choose the pathway that best describes why
                you are visiting Dementia Care Connect.
              </p>
            </div>
          </FadeIn>

          <div className="visitor-pathways-grid">
            <FadeIn delay={0}>
              <Link
                to="/learn-events/dementia-education"
                className="visitor-card visitor-card-purple"
              >
                <div className="visitor-card-header">
                  <span className="visitor-card-number">
                    01
                  </span>

                  <span className="visitor-card-arrow">
                    ↗
                  </span>
                </div>

                <div className="visitor-card-icon">
                  ?
                </div>

                <h3>
                  I want to understand
                </h3>

                <p>
                  Dementia, Alzheimer&apos;s, signs,
                  when to be concerned, and Healthy &
                  Active Living to support brain health,
                  wellbeing and dementia risk reduction.
                </p>

                <span className="visitor-card-link">
                  Understanding Dementia
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
                    02
                  </span>

                  <span className="visitor-card-arrow">
                    ↗
                  </span>
                </div>

                <div className="visitor-card-icon">
                  +
                </div>

                <h3>
                  I need help & support
                </h3>

                <p>
                  Next steps if concerned about changes
                  or after a diagnosis; assessment and
                  healthcare pathways; support services;
                  government and financial resources;
                  practical resources; and planning ahead.
                </p>

                <span className="visitor-card-link">
                  Find Help & Support
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
                    03
                  </span>

                  <span className="visitor-card-arrow">
                    ↗
                  </span>
                </div>

                <div className="visitor-card-icon">
                  ♡
                </div>

                <h3>
                  I am caring for someone
                </h3>

                <p>
                  Caregiver guidance, caregiver training,
                  support groups and relevant caregiver
                  support resources.
                </p>

                <span className="visitor-card-link">
                  Caregiver Support
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
                    04
                  </span>

                  <span className="visitor-card-arrow">
                    ↗
                  </span>
                </div>

                <div className="visitor-card-icon">
                  ▶
                </div>

                <h3>
                  I want to learn or participate
                </h3>

                <p>
                  Training, webinars, events,
                  learning resources and ways to
                  participate.
                </p>

                <span className="visitor-card-link">
                  Education & Events
                  <span>→</span>
                </span>
              </Link>
            </FadeIn>
          </div>

          <FadeIn delay={350}>
            <p className="pathways-note">
              Not sure which pathway is right for you?
              Start with the option that best matches
              what you need today.
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