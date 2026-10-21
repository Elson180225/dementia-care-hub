import PublishedRecords from "../../components/PublishedRecords";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import supportServices from "../../data/supportServices";
import governmentResources from "../../data/governmentResources";
import equipmentResources from "../../data/equipmentResources";
import { useLanguage } from "../../i18n/LanguageContext";

import "./ResourceFinder.css";

const needs = [
  {
    id: "healthcare",
    number: "01",
    title: "Assessment & Healthcare",
    description:
      "I am concerned about changes, symptoms or getting an assessment.",
    icon: "+",
  },
  {
    id: "services",
    number: "02",
    title: "Support Services",
    description:
      "I am looking for practical or community-based support.",
    icon: "♡",
  },
  {
    id: "financial",
    number: "03",
    title: "Government & Financial",
    description:
      "I need information about official programmes or financial support.",
    icon: "$",
  },
  {
    id: "equipment",
    number: "04",
    title: "Equipment & Practical Aids",
    description:
      "I am looking for equipment, reminders or assistive tools.",
    icon: "◇",
  },
];

const serviceTypes = {
  healthcare: [
    "Preparing for Assessment",
    "Government Healthcare",
    "Private Healthcare",
    "Healthcare Provider",
  ],

  services: [
    "Pharmacy",
    "Occupational Therapy",
    "Physiotherapy / Rehabilitation",
    "Home / Community Care",
    "Respite / Elderly Care",
    "Support Group / NGO",
  ],

  financial: [
    "Government Support",
    "Financial Assistance",
    "Caregiver Support",
    "Older Persons",
  ],

  equipment: [
    "Daily Living Aids",
    "Medication Support",
    "Orientation & Reminders",
    "Mobility & Safety Aids",
    "Assistive Technology",
  ],
};

const locations = [
  "Anywhere in Sarawak",
  "Kuching",
  "Sibu",
  "Bintulu",
  "Miri",
];

function ResourceFinder() {
  const { t } = useLanguage();
  const rf = t.resourceFinderPage || {};
  const currentNeeds = rf.needs || needs;

  const [step, setStep] = useState(1);

  const [need, setNeed] = useState("");

  const [supportType, setSupportType] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [showResults, setShowResults] =
    useState(false);

  /* =========================================================
     NORMALISE DATA FROM THE OTHER MODULES

     Later these arrays can be replaced by API responses.
  ========================================================= */

  const allResources = useMemo(() => {
    const supportRecords = supportServices.map(
      (item) => ({
        id: item.id,

        source: "services",

        title: item.name,

        type: item.category,

        location: item.city,

        state: item.state,

        description: item.service,

        secondary:
          item.specialistField,

        verificationStatus:
          item.verificationStatus,

        status: item.status,

        path: "/find-help/support-services",
      })
    );

    const governmentRecords =
      governmentResources.map((item) => ({
        id: item.id,

        source: "financial",

        title: item.title,

        type: item.category,

        location: item.location,

        state: item.location,

        description: item.summary,

        secondary: item.agency,

        verificationStatus:
          item.verificationStatus,

        status: item.status,

        path: "/find-help/government-financial",
      }));

    const equipmentRecords =
      equipmentResources.map((item) => ({
        id: item.id,

        source: "equipment",

        title: item.title,

        type: item.category,

        location: "Sarawak",

        state: "Sarawak",

        description:
          item.shortDescription,

        secondary:
          item.whereToFind,

        verificationStatus:
          item.verificationStatus,

        status: item.status,

        path: "/find-help/equipment-practical",
      }));

    return [
      ...supportRecords,
      ...governmentRecords,
      ...equipmentRecords,
    ];
  }, []);

  /* =========================================================
     FILTER
  ========================================================= */

  const results = useMemo(() => {
    if (need === "healthcare") {
      return [];
    }

    return allResources.filter(
      (resource) => {
        const needMatch =
          resource.source === need;

        const typeMatch =
          !supportType ||
          resource.type === supportType;

        const locationMatch =
          !location ||
          location === "Anywhere in Sarawak" ||
          resource.location === location ||
          resource.state === location ||
          resource.location === "Sarawak";

        return (
          needMatch &&
          typeMatch &&
          locationMatch
        );
      }
    );
  }, [
    allResources,
    need,
    supportType,
    location,
  ]);

  /* =========================================================
     ACTIONS
  ========================================================= */

  const chooseNeed = (selectedNeed) => {
    setNeed(selectedNeed);

    setSupportType("");

    setLocation("");

    setShowResults(false);

    setStep(2);
  };

  const chooseType = (type) => {
    setSupportType(type);

    setLocation("");

    setShowResults(false);

    setStep(3);
  };

  const findResources = () => {
    setShowResults(true);

    setTimeout(() => {
      document
        .getElementById("finder-results")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  const resetFinder = () => {
    setStep(1);

    setNeed("");

    setSupportType("");

    setLocation("");

    setShowResults(false);
  };

  const selectedNeed =
    needs.find(
      (item) => item.id === need
    );

  return (
    <main className="rf-page">
      <PublishedRecords kind="organisations" category="" title="Published directory records" />
      {/* =====================================================
          INTRO
      ====================================================== */}

      <section className="rf-intro">
        <div className="rf-intro-orb rf-orb-one" />
        <div className="rf-intro-orb rf-orb-two" />

        <div className="rf-container rf-intro-inner">
          <span className="rf-eyebrow">
            {rf.kicker || "Find Help & Support"}
          </span>

          <h1>
            {rf.notSureTitle || "Not sure where"}
            <br />
            <em>{rf.notSureTitleEm || "to start?"}</em>
          </h1>

          <p>
            {rf.notSureDesc || "Answer three simple questions and we will guide you towards the most relevant section or available resource."}
          </p>

          <a
            href="#resource-finder"
            className="rf-start-link"
          >
            {rf.startBtn || "Start finding support"}

            <span>
              ↓
            </span>
          </a>
        </div>
      </section>

      {/* =====================================================
          FINDER
      ====================================================== */}

      <section
        className="rf-finder"
        id="resource-finder"
      >
        <div className="rf-container">
          {/* TOP PROGRESS */}

          <div className="rf-progress">
            <div
              className={`rf-progress-item ${
                step >= 1
                  ? "rf-progress-active"
                  : ""
              }`}
            >
              <span>
                1
              </span>

              <p>
                {rf.step1Progress || "Your need"}
              </p>
            </div>

            <div className="rf-progress-line" />

            <div
              className={`rf-progress-item ${
                step >= 2
                  ? "rf-progress-active"
                  : ""
              }`}
            >
              <span>
                2
              </span>

              <p>
                {rf.step2Progress || "Support type"}
              </p>
            </div>

            <div className="rf-progress-line" />

            <div
              className={`rf-progress-item ${
                step >= 3
                  ? "rf-progress-active"
                  : ""
              }`}
            >
              <span>
                3
              </span>

              <p>
                {rf.step3Progress || "Location"}
              </p>
            </div>
          </div>

          <div className="rf-question-layout">
            {/* LEFT NUMBER */}

            <div className="rf-question-number">
              <span>
                0{step}
              </span>

              <small>
                / 03
              </small>
            </div>

            {/* QUESTION CONTENT */}

            <div className="rf-question-content">
              {/* STEP 1 */}

              {step === 1 && (
                <>
                  <span className="rf-question-label">
                    {rf.kicker || "Let's start here"}
                  </span>

                  <h2>
                    {rf.step1Title || "What do you need help with?"}
                  </h2>

                  <p className="rf-question-description">
                    {rf.subtitle || "Choose the option that most closely describes what you are looking for."}
                  </p>

                  <div className="rf-needs-grid">
                    {currentNeeds.map((item, idx) => {
                      const icon = needs[idx]?.icon || "+";
                      return (
                        <button
                          type="button"
                          key={item.id}
                          className="rf-need-card"
                          onClick={() =>
                            chooseNeed(
                              item.id
                            )
                          }
                        >
                          <div className="rf-need-top">
                            <span className="rf-need-number">
                              {
                                item.number
                              }
                            </span>

                            <span className="rf-need-icon">
                              {
                                icon
                              }
                            </span>
                          </div>

                          <h3>
                            {
                              item.title
                            }
                          </h3>

                          <p>
                            {
                              item.description
                            }
                          </p>

                          <strong>
                            {rf.selectNeedBtn || "Select"}
                            <span>
                              →
                            </span>
                          </strong>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* STEP 2 */}

              {step === 2 && (
                <>
                  <span className="rf-question-label">
                    {rf.youSelected || "You selected"}
                  </span>

                  <div className="rf-current-selection">
                    <span>
                      {
                        selectedNeed?.icon
                      }
                    </span>

                    <strong>
                      {
                        selectedNeed?.title
                      }
                    </strong>
                  </div>

                  <h2>
                    {rf.step2Heading || "What type of support are you looking for?"}
                  </h2>

                  <div className="rf-type-list">
                    {serviceTypes[
                      need
                    ]?.map(
                      (
                        type,
                        index
                      ) => (
                        <button
                          type="button"
                          key={type}
                          onClick={() =>
                            chooseType(
                              type
                            )
                          }
                        >
                          <span>
                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>

                          <strong>
                            {type}
                          </strong>

                          <span>
                            →
                          </span>
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    className="rf-back"
                    onClick={() =>
                      setStep(1)
                    }
                  >
                    {rf.back || "← Back"}
                  </button>
                </>
              )}

              {/* STEP 3 */}

              {step === 3 && (
                <>
                  <span className="rf-question-label">
                    {rf.finalQuestion || "Final question"}
                  </span>

                  <h2>
                    {rf.step3Heading || "Where are you looking for support?"}
                  </h2>

                  <p className="rf-question-description">
                    {rf.step3Desc || "Select the closest location. You can also search across Sarawak."}
                  </p>

                  <div className="rf-location-grid">
                    {locations.map(
                      (item) => (
                        <button
                          type="button"
                          key={item}
                          className={
                            location ===
                            item
                              ? "rf-location-active"
                              : ""
                          }
                          onClick={() =>
                            setLocation(
                              item
                            )
                          }
                        >
                          <span>
                            ◎
                          </span>

                          <strong>
                            {item}
                          </strong>
                        </button>
                      )
                    )}
                  </div>

                  <div className="rf-final-actions">
                    <button
                      type="button"
                      className="rf-back"
                      onClick={() =>
                        setStep(2)
                      }
                    >
                      {rf.back || "← Back"}
                    </button>

                    <button
                      type="button"
                      className="rf-find-button"
                      disabled={!location}
                      onClick={
                        findResources
                      }
                    >
                      {rf.findResourcesBtn || "Find my resources"}

                      <span>
                        →
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SELECTION TRAIL */}

          {need && (
            <div className="rf-trail">
              <span>
                {rf.yourJourney || "Your journey"}
              </span>

              <div>
                <strong>
                  {
                    selectedNeed?.title
                  }
                </strong>

                {supportType && (
                  <>
                    <span>
                      →
                    </span>

                    <strong>
                      {supportType}
                    </strong>
                  </>
                )}

                {location && (
                  <>
                    <span>
                      →
                    </span>

                    <strong>
                      {location}
                    </strong>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={
                  resetFinder
                }
              >
                {rf.startAgain || "Start again"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          RESULTS
      ====================================================== */}

      {showResults && (
        <section
          className="rf-results"
          id="finder-results"
        >
          <div className="rf-container">
            <div className="rf-results-header">
              <div>
                <span>
                  {rf.yourResults || "Your results"}
                </span>

                <h2>
                  {rf.resultsHeading || "Here is where you can go next."}
                </h2>

                <p>
                  {rf.resultsDesc || "These results are based on the choices you made above."}
                </p>
              </div>

              <div className="rf-results-count">
                <strong>
                  {need ===
                  "healthcare"
                    ? "1"
                    : results.length}
                </strong>

                <span>
                  {need ===
                    "healthcare"
                    ? (rf.pathwayLabel || "pathway")
                    : results.length ===
                      1
                    ? (rf.resourceLabel || "resource")
                    : (rf.resourcesLabel || "resources")}
                </span>
              </div>
            </div>

            {/* HEALTHCARE IS A PATHWAY, NOT DIRECTORY */}

            {need ===
            "healthcare" ? (
              <div className="rf-healthcare-result">
                <div className="rf-healthcare-number">
                  01
                </div>

                <div>
                  <span>
                    {rf.recommendedStep || "Recommended next step"}
                  </span>

                  <h3>
                    {rf.healthcarePathwayTitle || "Assessment & Healthcare"}
                  </h3>

                  <p>
                    {rf.healthcareResultDesc || "Follow the assessment pathway to prepare for an appointment, understand government and private healthcare routes, and find provider information."}
                  </p>
                </div>

                <Link
                  to="/find-help/assessment-healthcare"
                >
                  {rf.viewPathway || "View pathway"}
                  <span>
                    →
                  </span>
                </Link>
              </div>
            ) : results.length >
              0 ? (
              <div className="rf-results-list">
                {results.map(
                  (
                    resource,
                    index
                  ) => (
                    <article
                      className="rf-result"
                      key={
                        resource.id
                      }
                    >
                      <div className="rf-result-index">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div className="rf-result-content">
                        <div className="rf-result-meta">
                          <span>
                            {
                              resource.type
                            }
                          </span>

                          <span>
                            ◎{" "}
                            {
                              resource.location
                            }
                          </span>
                        </div>

                        <h3>
                          {
                            resource.title
                          }
                        </h3>

                        <p>
                          {
                            resource.description
                          }
                        </p>

                        {resource.secondary && (
                          <small>
                            {
                              resource.secondary
                            }
                          </small>
                        )}
                      </div>

                      <div className="rf-result-action">
                        <span
                          className={`rf-verification rf-verification-${resource.verificationStatus}`}
                        >
                          {resource.verificationStatus ===
                          "verified"
                            ? (rf.verified || "Verified")
                            : (rf.pendingVerification || "Pending verification")}
                        </span>

                        <Link
                          to={
                            resource.path
                          }
                        >
                          {rf.viewDetails || "View details"}
                          <span>
                            →
                          </span>
                        </Link>
                      </div>
                    </article>
                  )
                )}
              </div>
            ) : (
              <div className="rf-empty">
                <div>
                  ?
                </div>

                <h3>
                  {rf.emptyTitle || "No matching resource is available yet."}
                </h3>

                <p>
                  {rf.emptyDesc || "The directory does not currently contain a matching verified record for this combination."}
                </p>

                <button
                  type="button"
                  onClick={
                    resetFinder
                  }
                >
                  {rf.tryAnotherSearch || "Try another search"}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =====================================================
          HOW THE SYSTEM WORKS
      ====================================================== */}

      <section className="rf-system">
        <div className="rf-container">
          <div className="rf-system-layout">
            <div className="rf-system-heading">
              <span>
                {rf.systemEyebrow || "One source of information"}
              </span>

              <h2>
                {rf.systemTitle ? (
                  rf.systemTitle.split("\n").map((line, idx) => (
                    <span key={idx}>
                      {line}
                      {idx === 0 && <br />}
                    </span>
                  ))
                ) : (
                  <>
                    Directory in.
                    <br />
                    Relevant answers out.
                  </>
                )}
              </h2>

              <p>
                {rf.systemDesc || "The Resource Finder does not maintain a separate provider database. It helps users navigate information managed across the relevant support sections."}
              </p>
            </div>

            <div className="rf-system-flow">
              <div>
                <span>
                  01
                </span>

                <strong>
                  {rf.systemStep1Title || "Admin manages resources"}
                </strong>

                <p>
                  {rf.systemStep1Desc || "Records are added, updated and reviewed centrally."}
                </p>
              </div>

              <span className="rf-flow-arrow">
                ↓
              </span>

              <div>
                <span>
                  02
                </span>

                <strong>
                  {rf.systemStep2Title || "Resource Finder filters them"}
                </strong>

                <p>
                  {rf.systemStep2Desc || "User choices determine which information is most relevant."}
                </p>
              </div>

              <span className="rf-flow-arrow">
                ↓
              </span>

              <div>
                <span>
                  03
                </span>

                <strong>
                  {rf.systemStep3Title || "User reaches the right section"}
                </strong>

                <p>
                  {rf.systemStep3Desc || "The user can continue to the relevant verified information or external contact."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          BOUNDARY
      ====================================================== */}

      <section className="rf-boundary">
        <div className="rf-container">
          <div className="rf-boundary-box">
            <span>
              i
            </span>

            <div>
              <strong>
                {rf.boundaryBoxTitle || "Information & Navigation Only"}
              </strong>

              <p>
                {rf.boundaryBoxText || "Dementia Care Connect provides information, navigation and connection to external services. It does not provide appointment booking, medical referral or clinical services."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ResourceFinder;