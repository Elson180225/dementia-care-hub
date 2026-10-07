import { Link } from "react-router-dom";

import "./FindHelp.css";

function FindHelp() {
  return (
    <main className="find-help-page">
      {/* HERO */}

      <section className="find-help-hero">
        <div className="find-help-container">
          <span className="find-help-kicker">
            Find Help & Support
          </span>

          <h1>
            Start from where you are.
          </h1>

          <p>
            Whether you are concerned about changes,
            supporting someone after a diagnosis,
            or already know the type of help you need,
            this section will guide you towards the
            most relevant next step.
          </p>
        </div>
      </section>

      {/* ENTRY PATHWAYS */}

      <section className="find-help-pathways">
        <div className="find-help-container">
          <div className="find-help-heading">
            <span>Choose your starting point</span>

            <h2>
              What best describes your situation?
            </h2>

            <p>
              Select the option that feels closest to
              what you need today.
            </p>
          </div>

          <div className="find-help-card-grid">
            {/* CARD 1 */}

            <Link
              to="/find-help/assessment-healthcare"
              className="find-help-card find-help-card-purple"
            >
              <div className="find-help-card-top">
                <span className="find-help-card-number">
                  01
                </span>

                <span className="find-help-card-arrow">
                  ↗
                </span>
              </div>

              <div className="find-help-card-icon">
                ?
              </div>

              <h3>
                I am concerned about changes
              </h3>

              <p>
                You may have noticed changes in memory,
                thinking, behaviour or daily life and want
                to understand what to do next.
              </p>

              <span className="find-help-card-link">
                Go to Assessment & Healthcare →
              </span>
            </Link>

            {/* CARD 2 */}

            <div className="find-help-card find-help-card-sage">
              <div className="find-help-card-top">
                <span className="find-help-card-number">
                  02
                </span>
              </div>

              <div className="find-help-card-icon">
                +
              </div>

              <h3>
                I / my family member has been diagnosed
              </h3>

              <p>
                Explore the areas that may need attention
                after diagnosis and move directly to the
                most relevant support section.
              </p>

              <div className="diagnosis-links">
                <Link to="/learn-events/dementia-education">
                  Understanding the diagnosis
                </Link>

                <Link to="/find-help/assessment-healthcare">
                  Healthcare follow-up
                </Link>

                <Link to="/caregiver-support">
                  Daily care & caregiver guidance
                </Link>

                <Link to="/find-help/support-services">
                  External support services
                </Link>

                <Link to="/find-help/government-financial">
                  Government / financial support
                </Link>

                <Link to="/find-help/equipment-practical">
                  Practical aids / equipment
                </Link>

                <Link to="/learn-events">
                  Education & learning resources
                </Link>
              </div>
            </div>

            {/* CARD 3 */}

            <Link
              to="/find-help/resource-finder"
              className="find-help-card find-help-card-gold"
            >
              <div className="find-help-card-top">
                <span className="find-help-card-number">
                  03
                </span>

                <span className="find-help-card-arrow">
                  ↗
                </span>
              </div>

              <div className="find-help-card-icon">
                ⌕
              </div>

              <h3>
                I already know the type of help I need
              </h3>

              <p>
                Use the Resource Finder to filter available
                information by need, support type and
                location.
              </p>

              <span className="find-help-card-link">
                Open Resource Finder →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* DETAILED AREAS */}

      <section className="find-help-areas">
        <div className="find-help-container">
          <div className="find-help-heading compact-heading">
            <span>Detailed help areas</span>

            <h2>
              Explore support directly.
            </h2>
          </div>

          <div className="find-help-area-grid">
            <Link to="/find-help/assessment-healthcare">
              <span>01</span>
              <h3>Assessment & Healthcare</h3>
              <p>
                Preparing for assessment, government and
                private healthcare pathways, and providers.
              </p>
            </Link>

            <Link to="/find-help/support-services">
              <span>02</span>
              <h3>Support Services Directory</h3>
              <p>
                Browse relevant verified external services
                and support providers.
              </p>
            </Link>

            <Link to="/find-help/government-financial">
              <span>03</span>
              <h3>Government & Financial Resources</h3>
              <p>
                Find official programmes, assistance and
                financial support information.
              </p>
            </Link>

            <Link to="/find-help/equipment-practical">
              <span>04</span>
              <h3>Equipment & Practical Resources</h3>
              <p>
                Explore practical aids, reminder tools,
                mobility aids and assistive technology.
              </p>
            </Link>

            <Link to="/find-help/resource-finder">
              <span>05</span>
              <h3>Resource Finder</h3>
              <p>
                Filter available resources by need,
                support type and location.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICE BOUNDARY */}

      <section className="find-help-boundary">
        <div className="find-help-container">
          <div className="find-help-boundary-box">
            <div className="boundary-icon">i</div>

            <div>
              <span>Information & Navigation Only</span>

              <h2>
                Dementia Care Connect helps you find the
                next step.
              </h2>

              <p>
                Dementia Care Connect provides information,
                navigation and connection to relevant
                external services. It does not provide
                appointment booking, medical referral or
                clinical services.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default FindHelp;