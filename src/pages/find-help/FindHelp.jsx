import PublishedRecords from "../../components/PublishedRecords";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";

import "./FindHelp.css";

function FindHelp() {
  const { t } = useLanguage();
  const fh = t.findHelp;

  return (
    <main className="find-help-page">
      <PublishedRecords kind="organisations" category="" title="Published directory records" />
      {/* HERO */}

      <section className="find-help-hero">
        <div className="find-help-container">
          <span className="find-help-kicker">
            {fh.kicker}
          </span>

          <h1>
            {fh.title}
          </h1>

          <p>
            {fh.subtitle}
          </p>
        </div>
      </section>

      {/* ENTRY PATHWAYS */}

      <section className="find-help-pathways">
        <div className="find-help-container">
          <div className="find-help-heading">
            <span>{fh.startingPointKicker || "Choose your starting point"}</span>

            <h2>
              {fh.startingPointHeading || "What best describes your situation?"}
            </h2>

            <p>
              {fh.startingPointSub || "Select the option that feels closest to what you need today."}
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
                  {fh.card1?.number || "01"}
                </span>

                <span className="find-help-card-arrow">
                  ↗
                </span>
              </div>

              <div className="find-help-card-icon">
                ?
              </div>

              <h3>
                {fh.card1?.title || "I am concerned about changes"}
              </h3>

              <p>
                {fh.card1?.text || "You may have noticed changes in memory, thinking, behaviour or daily life and want to understand what to do next."}
              </p>

              <span className="find-help-card-link">
                {fh.card1?.link || "Go to Assessment & Healthcare →"}
              </span>
            </Link>

            {/* CARD 2 */}

            <div className="find-help-card find-help-card-sage">
              <div className="find-help-card-top">
                <span className="find-help-card-number">
                  {fh.card2?.number || "02"}
                </span>
              </div>

              <div className="find-help-card-icon">
                +
              </div>

              <h3>
                {fh.card2?.title || "I / my family member has been diagnosed"}
              </h3>

              <p>
                {fh.card2?.text || "Explore the areas that may need attention after diagnosis and move directly to the most relevant support section."}
              </p>

              <div className="diagnosis-links">
                <Link to="/learn-events/dementia-education">
                  {fh.card2?.link1 || "Understanding the diagnosis"}
                </Link>

                <Link to="/find-help/assessment-healthcare">
                  {fh.card2?.link2 || "Healthcare follow-up"}
                </Link>

                <Link to="/caregiver-support">
                  {fh.card2?.link3 || "Daily care & caregiver guidance"}
                </Link>

                <Link to="/find-help/support-services">
                  {fh.card2?.link4 || "External support services"}
                </Link>

                <Link to="/find-help/government-financial">
                  {fh.card2?.link5 || "Government / financial support"}
                </Link>

                <Link to="/find-help/equipment-practical">
                  {fh.card2?.link6 || "Practical aids / equipment"}
                </Link>

                <Link to="/caregiver-support#support-groups">
                  Peer / community support → Support Groups
                </Link>

                <a href="#advance-planning">
                  Planning Ahead → Advance Planning
                </a>

                <Link to="/learn-events">
                  {fh.card2?.link7 || "Education & learning resources"}
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
                  {fh.card3?.number || "03"}
                </span>

                <span className="find-help-card-arrow">
                  ↗
                </span>
              </div>

              <div className="find-help-card-icon">
                ⌕
              </div>

              <h3>
                {fh.card3?.title || "I already know the type of help I need"}
              </h3>

              <p>
                {fh.card3?.text || "Use the Resource Finder to filter available information by need, support type and location."}
              </p>

              <span className="find-help-card-link">
                {fh.card3?.link || "Open Resource Finder →"}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ADVANCE PLANNING PLACEHOLDER */}

      <section
        className="find-help-planning"
        id="advance-planning"
      >
        <div className="find-help-container">
          <div className="find-help-planning-card">
            <span>Planning Ahead</span>

            <div>
              <h2>Advance Planning</h2>

              <p>
                Planning ahead can help individuals and families
                think about future care, preferences and important
                decisions early. Detailed guidance will be added
                after professional review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED AREAS */}

      <section className="find-help-areas">
        <div className="find-help-container">
          <div className="find-help-heading compact-heading">
            <span>{fh.areasKicker || "Detailed help areas"}</span>

            <h2>
              {fh.areasHeading || "Explore support directly."}
            </h2>
          </div>

          <div className="find-help-area-grid">
            {(fh.areas || [
              {
                num: "01",
                title: "Assessment & Healthcare",
                text: "Preparing for assessment, government and private healthcare pathways, and providers.",
                to: "/find-help/assessment-healthcare",
              },
              {
                num: "02",
                title: "Support Services Directory",
                text: "Browse relevant verified external services and support providers.",
                to: "/find-help/support-services",
              },
              {
                num: "03",
                title: "Government & Financial Resources",
                text: "Find official programmes, assistance and financial support information.",
                to: "/find-help/government-financial",
              },
              {
                num: "04",
                title: "Equipment & Practical Resources",
                text: "Explore practical aids, reminder tools, mobility aids and assistive technology.",
                to: "/find-help/equipment-practical",
              },
              {
                num: "05",
                title: "Resource Finder",
                text: "Filter available resources by need, support type and location.",
                to: "/find-help/resource-finder",
              },
            ]).map((area) => (
              <Link key={area.num} to={area.to}>
                <span>{area.num}</span>
                <h3>{area.title}</h3>
                <p>{area.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE BOUNDARY */}

      <section className="find-help-boundary">
        <div className="find-help-container">
          <div className="find-help-boundary-box">
            <div className="boundary-icon">i</div>

            <div>
              <span>{fh.boundaryKicker || "Information & Navigation Only"}</span>

              <h2>
                {fh.boundaryHeading || "Dementia Care Connect helps you find the next step."}
              </h2>

              <p>
                {fh.boundaryText || "Dementia Care Connect provides information, navigation and connection to relevant external services. It does not provide appointment booking, medical referral or clinical services."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default FindHelp;