import { Link } from "react-router-dom";
import "./Home.css";

import heroArtwork from "../assets/alzheimers-hero.jpg";
import understandDementia from "../assets/understand-dementia.jpg";
import healthcareSupport from "../assets/healthcare-support.jpg";
import learningEvents from "../assets/learning-events.jpg";
import caregiverSupport from "../assets/caregiver-support.jpg";

import FadeIn from "../components/FadeIn/FadeIn";

function Home() {
  return (
    <main className="home-page">
      {/* HERO */}
        <section className="hero-section">
    <div className="section-container hero-layout">
        <div className="hero-copy">
        <span className="hero-eyebrow">Rotary Hope Care</span>

        <h1>
            Supporting people, families and caregivers through dementia care.
        </h1>

        <p>
            Clear information, trusted resources and community support for
            people living with dementia and Alzheimer&apos;s disease.
        </p>

        <div className="hero-actions">
            <Link to="/find-help" className="hero-btn hero-btn-primary">
            Find Support
            </Link>

            <Link
            to="/understand-dementia"
            className="hero-btn hero-btn-secondary"
            >
            Understand Dementia
            </Link>
        </div>
        </div>

        <div className="hero-artwork">
        <img
            src={heroArtwork}
            alt="Rotary Hope Care Alzheimer's Care"
        />
        </div>
    </div>

    <div className="scroll-indicator">
        <span>Scroll to explore</span>
        <div className="scroll-line" />
    </div>
    </section>

      {/* WELCOME */}
      <section className="welcome-section">
        <FadeIn>
          <div className="section-container welcome-layout">
            <div>
              <span className="section-label">Welcome</span>

              <h2>
                A simpler place to understand dementia and find support.
              </h2>
            </div>

            <div className="welcome-copy">
              <p>
                This platform is designed to provide accessible information and
                useful resources for people living with dementia, caregivers,
                families and the wider community.
              </p>

              <p>
                Whether you are trying to understand dementia, looking for
                healthcare resources or interested in community training, you
                can start here.
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* QUICK NAVIGATION */}
      <section className="explore-section">
        <div className="section-container">
          <FadeIn>
            <div className="section-heading">
              <span className="section-label">Explore</span>

              <h2>What can we help you with today?</h2>

              <p>
                Choose a section below to find the information most relevant to
                you.
              </p>
            </div>
          </FadeIn>

          <div className="explore-grid">
            <FadeIn delay={0}>
              <Link
                to="/understand-dementia"
                className="explore-card"
              >
                <span className="explore-number">01</span>

                <div>
                  <h3>Understand Dementia</h3>

                  <p>
                    Learn about dementia, Alzheimer&apos;s disease, signs,
                    changes and when medical advice may be helpful.
                  </p>
                </div>

                <span className="explore-arrow">→</span>
              </Link>
            </FadeIn>

            <FadeIn delay={100}>
              <Link to="/find-help" className="explore-card">
                <span className="explore-number">02</span>

                <div>
                  <h3>Find Help</h3>

                  <p>
                    Explore healthcare, financial, community and practical
                    support resources.
                  </p>
                </div>

                <span className="explore-arrow">→</span>
              </Link>
            </FadeIn>

            <FadeIn delay={200}>
              <Link
                to="/caregiver-support"
                className="explore-card"
              >
                <span className="explore-number">03</span>

                <div>
                  <h3>Caregiver Support</h3>

                  <p>
                    Find guidance and resources for family members, friends and
                    caregivers.
                  </p>
                </div>

                <span className="explore-arrow">→</span>
              </Link>
            </FadeIn>

            <FadeIn delay={300}>
              <Link to="/learn-events" className="explore-card">
                <span className="explore-number">04</span>

                <div>
                  <h3>Learn & Events</h3>

                  <p>
                    Explore dementia education, webinars and Certified
                    Trainer-led events.
                  </p>
                </div>

                <span className="explore-arrow">→</span>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* UNDERSTAND DEMENTIA */}
      <section className="image-content-section">
        <FadeIn>
          <div className="section-container image-content-layout">
            <div className="section-image">
              <img
                src={understandDementia}
                alt="Older adult spending time with a family member"
              />
            </div>

            <div className="section-copy">
              <span className="section-label">
                Understanding dementia
              </span>

              <h2>
                Knowledge can make the next step feel clearer.
              </h2>

              <p>
                Dementia describes a range of conditions that affect memory,
                thinking and everyday functioning. Alzheimer&apos;s disease is
                the most common form of dementia.
              </p>

              <p>
                Learning about common signs and changes can help people and
                families understand when professional advice or additional
                support may be useful.
              </p>

              <Link
                to="/understand-dementia"
                className="text-link"
              >
                Learn about dementia
                <span>→</span>
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* HEALTHCARE */}
      <section className="healthcare-section">
        <FadeIn>
          <div className="section-container healthcare-layout">
            <div className="healthcare-copy">
              <span className="section-label">Find Help</span>

              <h2>
                Find healthcare and support resources.
              </h2>

              <p>
                Explore information that can help connect people living with
                dementia and caregivers with doctors, mental health
                professionals, organisations and other useful resources.
              </p>

              <Link
                to="/find-help/healthcare-resources"
                className="primary-link-button"
              >
                Explore Healthcare Resources
              </Link>
            </div>

            <div className="healthcare-image">
              <img
                src={healthcareSupport}
                alt="Healthcare professional speaking with an older adult"
              />
            </div>
          </div>
        </FadeIn>
      </section>

      {/* RESOURCE CARDS */}
      <section className="resources-section">
        <div className="section-container">
          <FadeIn>
            <div className="section-heading">
              <span className="section-label">
                Support resources
              </span>

              <h2>Different needs. Different ways to find help.</h2>
            </div>
          </FadeIn>

          <div className="resources-grid">
            <FadeIn delay={0}>
              <Link
                to="/find-help/healthcare-resources"
                className="resource-card"
              >
                <span>01</span>
                <h3>Healthcare Resources</h3>
                <p>
                  Doctors, mental health professionals and healthcare
                  organisations.
                </p>
                <strong>Explore →</strong>
              </Link>
            </FadeIn>

            <FadeIn delay={100}>
              <Link
                to="/find-help/financial-resources"
                className="resource-card"
              >
                <span>02</span>
                <h3>Financial Resources</h3>
                <p>
                  Information about organisations and external financial
                  resources.
                </p>
                <strong>Explore →</strong>
              </Link>
            </FadeIn>

            <FadeIn delay={200}>
              <Link
                to="/find-help/equipment-resources"
                className="resource-card"
              >
                <span>03</span>
                <h3>Equipment & Daily Living</h3>
                <p>
                  Practical equipment and resources that may support daily
                  living.
                </p>
                <strong>Explore →</strong>
              </Link>
            </FadeIn>

            <FadeIn delay={300}>
              <Link
                to="/find-help/services"
                className="resource-card"
              >
                <span>04</span>
                <h3>Services Near You</h3>
                <p>
                  Find organisations and support services available in your
                  area.
                </p>
                <strong>Explore →</strong>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* LEARNING & EVENTS */}
      <section className="learning-section">
        <FadeIn>
          <div className="section-container learning-layout">
            <div className="learning-image">
              <img
                src={learningEvents}
                alt="Community learning and training event"
              />
            </div>

            <div className="learning-copy">
              <span className="section-label">
                Learn & Events
              </span>

              <h2>
                Learn together. Connect with your community.
              </h2>

              <p>
                Discover education sessions, webinars and events led by
                Certified Trainers. Upcoming events can be explored by city and
                delivery language.
              </p>

              <Link
                to="/learn-events/events"
                className="primary-link-button"
              >
                View Upcoming Events
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* CAREGIVER FEATURE */}
      <section className="caregiver-feature">
        <FadeIn>
          <div className="section-container caregiver-image-wrapper">
            <img
              src={caregiverSupport}
              alt="Caregiver supporting an older adult"
            />

            <div className="caregiver-overlay" />

            <div className="caregiver-content">
              <span className="section-label light-label">
                Caregiver Support
              </span>

              <h2>
                Caring for someone matters. Your wellbeing matters too.
              </h2>

              <p>
                Find practical guidance and supportive resources for family
                members, friends and caregivers supporting someone living with
                dementia.
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
      </section>

      {/* FINAL CTA */}
      <section className="final-cta-section">
        <FadeIn>
          <div className="section-container final-cta-layout">
            <div>
              <span className="section-label">
                Need help?
              </span>

              <h2>
                You don&apos;t need to know exactly where to start.
              </h2>

              <p>
                Browse support resources or contact the project team if you
                need help finding the right information.
              </p>
            </div>

            <div className="final-cta-actions">
              <Link
                to="/find-help"
                className="final-primary-button"
              >
                Find Help
              </Link>

              <Link
                to="/about/contact"
                className="final-secondary-button"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}

export default Home;