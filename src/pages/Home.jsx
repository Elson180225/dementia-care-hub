import { Link } from "react-router-dom";

import "./Home.css";

import heroArtwork from "../assets/alzheimers-hero.jpg";
import understandDementia from "../assets/understand-dementia.jpg";
import healthcareSupport from "../assets/healthcare-support.jpg";
import learningEvents from "../assets/learning-events.jpg";
import caregiverSupport from "../assets/caregiver-support.jpg";

import FadeIn from "../components/FadeIn/FadeIn";
import FAQ from "../components/FAQ/FAQ";

function Home() {
  return (
    <main className="home-page">
      {/* =========================
          HERO
      ========================== */}

      <section className="hero-section">
        <div className="section-container hero-layout">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              Rotary Hope Care
            </span>

            <h1>
              Supporting people, families and caregivers through dementia care.
            </h1>

            <p>
              Clear information, trusted resources and community support for
              people living with dementia and Alzheimer&apos;s disease.
            </p>

            <div className="hero-actions">
              <Link
                to="/find-help"
                className="hero-btn hero-btn-primary"
              >
                Find Support
              </Link>

              <Link
                to="/understand-dementia"
                className="hero-btn hero-btn-secondary"
              >
                Understand Dementia
              </Link>
            </div>

            <div className="hero-help-line">
              <span className="hero-help-dot" />

              <div>
                <strong>
                  Concerned about memory or behaviour changes?
                </strong>

                <Link to="/understand-dementia/medical-advice">
                  Start here →
                </Link>
              </div>
            </div>
          </div>

          <div className="hero-artwork">
            <img
              src={heroArtwork}
              alt="Rotary Hope Care Alzheimer's Care artwork"
            />
          </div>
        </div>

        <div className="scroll-indicator">
          <span>Scroll to explore</span>
          <span className="scroll-line" />
        </div>
      </section>

      {/* =========================
          UNDERSTAND DEMENTIA
      ========================== */}

      <section className="dementia-section">
        <div className="section-container dementia-layout">
          <FadeIn>
            <div className="dementia-image">
              <img
                src={understandDementia}
                alt="Older adult receiving support from family"
              />
            </div>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="dementia-copy">
              <span className="section-label">
                Understand Dementia
              </span>

              <h2>
                What is dementia and Alzheimer&apos;s disease?
              </h2>

              <p>
                Dementia is a general term used to describe conditions that
                affect memory, thinking, behaviour and everyday functioning.
                Alzheimer&apos;s disease is the most common cause of dementia.
              </p>

              <p>
                Understanding the signs and changes can help people, families
                and caregivers know when to seek advice and where to find
                appropriate support.
              </p>

              <Link
                to="/understand-dementia"
                className="text-link"
              >
                Learn more
                <span>→</span>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* =========================
          QUICK RESOURCES
      ========================== */}

      <section className="finder-section">
        <div className="section-container">
          <FadeIn>
            <div className="section-heading finder-heading">
              <span className="section-label">
                Quick Resource Finder
              </span>

              <h2>
                What are you looking for today?
              </h2>

              <p>
                Choose a category to quickly find useful information,
                resources and available support.
              </p>
            </div>
          </FadeIn>

          <div className="finder-grid">
            <FadeIn delay={0}>
              <Link
                to="/find-help/healthcare-resources"
                className="finder-card"
              >
                <div className="finder-icon">+</div>

                <h3>
                  Healthcare Resources
                </h3>

                <p>
                  Find doctors, mental health professionals and healthcare
                  organisations that may provide support.
                </p>

                <span className="finder-link">
                  Explore resources →
                </span>
              </Link>
            </FadeIn>

            <FadeIn delay={100}>
              <Link
                to="/caregiver-support"
                className="finder-card"
              >
                <div className="finder-icon">♡</div>

                <h3>
                  Caregiver Support
                </h3>

                <p>
                  Practical information and support for caregivers, families
                  and people caring for someone with dementia.
                </p>

                <span className="finder-link">
                  View support →
                </span>
              </Link>
            </FadeIn>

            <FadeIn delay={200}>
              <Link
                to="/find-help/financial-resources"
                className="finder-card"
              >
                <div className="finder-icon">$</div>

                <h3>
                  Financial Resources
                </h3>

                <p>
                  Explore organisations and available financial resources that
                  may assist individuals and families.
                </p>

                <span className="finder-link">
                  Find resources →
                </span>
              </Link>
            </FadeIn>

            <FadeIn delay={300}>
              <Link
                to="/find-help/equipment-resources"
                className="finder-card"
              >
                <div className="finder-icon">⌂</div>

                <h3>
                  Equipment & Daily Living
                </h3>

                <p>
                  Discover practical equipment and resources that may support
                  safety and everyday living.
                </p>

                <span className="finder-link">
                  Explore options →
                </span>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* =========================
          HEALTHCARE FEATURE
      ========================== */}

      <section className="healthcare-feature">
        <div className="section-container healthcare-layout">
          <FadeIn>
            <div className="healthcare-copy">
              <span className="section-label">
                Find Help
              </span>

              <h2>
                Finding the right support can make a difference.
              </h2>

              <p>
                Access information about healthcare professionals, mental
                health support, partner institutions and community resources
                for people living with dementia and their caregivers.
              </p>

              <Link
                to="/find-help"
                className="primary-button"
              >
                Explore Support Resources
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="healthcare-image">
              <img
                src={healthcareSupport}
                alt="Healthcare professional speaking with older adult and family"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* =========================
          EVENTS
      ========================== */}

      <section className="events-section">
        <div className="section-container">
          <FadeIn>
            <div className="events-heading">
              <div>
                <span className="section-label">
                  Learn & Events
                </span>

                <h2>
                  Upcoming Certified Trainer Events
                </h2>
              </div>

              <Link
                to="/learn-events/events"
                className="events-view-all"
              >
                View all events →
              </Link>
            </div>
          </FadeIn>

          <div className="events-layout">
            <FadeIn>
              <div className="events-image">
                <img
                  src={learningEvents}
                  alt="Community dementia education and training event"
                />
              </div>
            </FadeIn>

            <FadeIn delay={120}>
              <div className="events-list">
                <div className="event-item">
                  <div className="event-date">
                    <strong>15</strong>
                    <span>Oct</span>
                  </div>

                  <div className="event-info">
                    <span className="event-type">
                      Workshop
                    </span>

                    <h3>
                      Dementia Awareness Workshop
                    </h3>

                    <p>
                      Bintulu • English
                    </p>

                    <Link to="/learn-events/events">
                      Learn more →
                    </Link>
                  </div>
                </div>

                <div className="event-item">
                  <div className="event-date">
                    <strong>28</strong>
                    <span>Oct</span>
                  </div>

                  <div className="event-info">
                    <span className="event-type">
                      Training
                    </span>

                    <h3>
                      Supporting Families & Caregivers
                    </h3>

                    <p>
                      Kuching • Bahasa Melayu
                    </p>

                    <Link to="/learn-events/events">
                      Learn more →
                    </Link>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* =========================
          CAREGIVER
      ========================== */}

      <section className="caregiver-section">
        <div className="section-container">
          <FadeIn>
            <div className="caregiver-wrapper">
              <img
                src={caregiverSupport}
                alt="Caregiver supporting an older adult"
              />

              <div className="caregiver-overlay" />

              <div className="caregiver-copy">
                <span className="section-label section-label-light">
                  Caregiver Support
                </span>

                <h2>
                  Supporting someone you care about can feel overwhelming.
                </h2>

                <p>
                  Find practical guidance, wellbeing resources and useful
                  information to support both caregivers and families.
                </p>

                <Link
                  to="/caregiver-support"
                  className="caregiver-button"
                >
                  Explore Caregiver Support
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* =========================
          WHO CAN HELP
      ========================== */}

      <section className="who-section">
        <div className="section-container">
          <FadeIn>
            <div className="section-heading who-heading">
              <span className="section-label">
                Support Network
              </span>

              <h2>
                Who can help?
              </h2>

              <p>
                Dementia support often involves families, healthcare
                professionals and community organisations working together.
              </p>
            </div>
          </FadeIn>

          <div className="who-grid">
            <FadeIn delay={0}>
              <div className="who-card">
                <span className="who-number">
                  01
                </span>

                <h3>
                  Healthcare Professionals
                </h3>

                <p>
                  Doctors, specialists and mental health professionals can
                  provide assessment, advice and ongoing healthcare support.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={120}>
              <div className="who-card">
                <span className="who-number">
                  02
                </span>

                <h3>
                  Caregivers & Families
                </h3>

                <p>
                  Families and caregivers play an important role in daily
                  support, communication and maintaining quality of life.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={240}>
              <div className="who-card">
                <span className="who-number">
                  03
                </span>

                <h3>
                  Support Organisations
                </h3>

                <p>
                  Community organisations and partner institutions may offer
                  education, resources and additional support services.
                </p>
              </div>
            </FadeIn>
          </div>

          <div className="who-action">
            <Link
              to="/find-help"
              className="primary-button"
            >
              Find Available Support
            </Link>
          </div>
        </div>
      </section>

      {/* =========================
          FAQ
      ========================== */}

      <FAQ />

      {/* =========================
          FINAL CTA
      ========================== */}

      <section className="final-cta">
        <FadeIn>
          <div className="section-container final-cta-layout">
            <div>
              <span className="section-label">
                Need More Help?
              </span>

              <h2>
                Still not sure where to start?
              </h2>

              <p>
                Explore available resources or contact the project team for
                guidance on where to find the most relevant information and
                support.
              </p>
            </div>

            <div className="final-cta-actions">
              <Link
                to="/about/contact"
                className="final-primary"
              >
                Contact Us
              </Link>

              <Link
                to="/find-help"
                className="final-secondary"
              >
                Find Help
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}

export default Home;