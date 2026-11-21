import { LastReviewed } from '../../components/PublicFeatures';
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

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


function ResourceNeedIcon({ type }) {
  const common = {
    viewBox: "0 0 24 24",
    width: "30",
    height: "30",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const icons = {
    healthcare: <svg {...common}><path d="M6 3v5a4 4 0 0 0 8 0V3" /><path d="M4 3h4M12 3h4" /><circle cx="19" cy="11" r="2" /></svg>,
    services: <svg {...common}><circle cx="8" cy="8" r="2" /><circle cx="16" cy="8" r="2" /><path d="M4 18c1-3 2.5-5 4-5s3 2 4 5M12 18c1-3 2.5-5 4-5s3 2 4 5" /></svg>,
    financial: <svg {...common}><path d="M3 9h18L12 3 3 9Z" /><path d="M5 10v7M9 10v7M15 10v7M19 10v7" /><path d="M3 18h18" /></svg>,
    equipment: <svg {...common}><circle cx="9" cy="5" r="2" /><path d="M9 8v5h5l2 5M9 11H6a4 4 0 1 0 4 6" /></svg>,
  };

  return icons[type] || icons.services;
}

function normaliseValue(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normaliseCategory(value = "") {
  const category = normaliseValue(value);

  if (category === "support-group" || category === "support group") {
    return "services";
  }

  return category;
}

function ResourceFinder() {
  const { t } = useLanguage();
  const { search } = useLocation();
  const linkedResource = new URLSearchParams(search).get("resource");
  const rf = t.resourceFinderPage || {};
  const currentNeeds = rf.needs || needs;

  const [directory, setDirectory] = useState([]);
  const [directoryError, setDirectoryError] = useState("");
  const [directoryLoading, setDirectoryLoading] =
    useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/public/organisations", {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load published directory records."
          );
        }

        return response.json();
      })
      .then((rows) => {
        setDirectory(
          Array.isArray(rows) ? rows : []
        );
        setDirectoryError("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setDirectoryError(
            "Published directory records could not be loaded. Please try again later."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDirectoryLoading(false);
        }
      });

    return () => controller.abort();
  }, []);
  const [step, setStep] = useState(1);

  const [need, setNeed] = useState("");

  const [supportType, setSupportType] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [showResults, setShowResults] =
    useState(false);

  const [showNeedGuide, setShowNeedGuide] =
    useState(false);

  const [expandedResource, setExpandedResource] =
    useState(null);

  /* =========================================================
     NORMALISE PUBLISHED DATABASE RECORDS

     Services, financial support and equipment are loaded from
     the managed organisations directory. Healthcare remains a
     guided pathway rather than a directory result.
  ========================================================= */

  const allResources = useMemo(() => {
    return directory.flatMap((record) => {
      const source = normaliseCategory(
        record.category
      );

      if (
        !["services", "financial", "equipment"].includes(
          source
        )
      ) {
        return [];
      }

      const rawServices = Array.isArray(record.services)
        ? record.services
        : typeof record.services === "string"
          ? [record.services]
          : [];

      const types = rawServices.length
        ? rawServices
        : ["Other"];

      return types.map((type) => ({
        id: `${record.id}-${type}`,
        source,
        recordId: String(record.id),
        title:
          record.name ||
          "Published resource",
        type,
        location:
          record.city ||
          record.state ||
          "Sarawak",
        state:
          record.state ||
          "Sarawak",
        description:
          record.specialist_field ||
          "Published resource information.",
        secondary:
          record.is_example
            ? "Example only — not a real service."
            : record.source || "",
        verificationStatus:
          record.is_example
            ? "example"
            : record.review_status === "current"
              ? "verified"
              : "pending",
        address: record.address || "",
        postcode: record.postcode || "",
        phone: record.phone || "",
        email: record.email || "",
        website: record.website || "",
        openingHours: record.opening_hours || "",
        eligibility: record.eligibility || "",
        fees: record.fees || "",
        sourceLabel: record.source || "",
        reviewStatus: record.review_status || "",
        lastReviewed: record.last_reviewed_at || "",
        isExample: Boolean(record.is_example),
      }));
    });
  }, [directory]);

  useEffect(() => {
    if (!linkedResource) return;
    const resource = allResources.find(row => row.recordId === linkedResource);
    if (!resource) return;
    setNeed(resource.source);
    setSupportType('');
    setLocation('');
    setStep(3);
    setShowResults(true);
    setExpandedResource(resource.id);
    const frame = requestAnimationFrame(() => document.getElementById('finder-results')?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [linkedResource, allResources]);

  /* =========================================================
     FILTER
  ========================================================= */

  const results = useMemo(() => {
    if (need === "healthcare") {
      return [];
    }

    return allResources.filter(
      (resource) => {
        const selectedNeed =
          normaliseCategory(need);
        const resourceNeed =
          normaliseCategory(resource.source);

        const selectedType =
          normaliseValue(supportType);
        const resourceType =
          normaliseValue(resource.type);

        const selectedLocation =
          normaliseValue(location);
        const resourceLocation =
          normaliseValue(resource.location);
        const resourceState =
          normaliseValue(resource.state);

        const needMatch =
          resourceNeed === selectedNeed;

        const typeMatch =
          !selectedType ||
          resourceType === selectedType;

        const locationMatch =
          !selectedLocation ||
          selectedLocation ===
            normaliseValue("Anywhere in Sarawak") ||
          resourceLocation === selectedLocation ||
          resourceState === selectedLocation ||
          resourceLocation === "sarawak";

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

    setShowNeedGuide(false);
    setExpandedResource(null);

    setStep(2);
  };

  const chooseType = (type) => {
    setSupportType(type);

    setLocation("");

    setShowResults(false);
    setExpandedResource(null);

    setStep(3);
  };

  const findResources = () => {
    if (
      need !== "healthcare" &&
      directoryLoading
    ) {
      return;
    }

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

    setShowNeedGuide(false);
    setExpandedResource(null);
  };

  const selectedNeed =
    needs.find(
      (item) => item.id === need
    );

  return (
    <main className="rf-page">
      {(directoryLoading ||
        directoryError) && (
        <div className="rf-directory-status">
          {directoryLoading && (
            <p role="status">
              Loading published resources…
            </p>
          )}

          {directoryError && (
            <p role="alert">
              {directoryError}
            </p>
          )}
        </div>
      )}
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
                              <ResourceNeedIcon type={item.id} />
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

                  <div className="rf-need-guide">
                    <button
                      type="button"
                      className="rf-need-guide-toggle"
                      onClick={() =>
                        setShowNeedGuide(
                          (current) =>
                            !current
                        )
                      }
                      aria-expanded={
                        showNeedGuide
                      }
                    >
                      <span>
                        Not sure where to start?
                      </span>

                      <strong>
                        Help me choose
                      </strong>

                      <span
                        className="rf-need-guide-arrow"
                        aria-hidden="true"
                      >
                        {showNeedGuide
                          ? "↑"
                          : "↓"}
                      </span>
                    </button>

                    {showNeedGuide && (
                      <div className="rf-need-guide-content">
                        <p className="rf-need-guide-intro">
                          Choose what sounds closest to your situation.
                        </p>

                        <div className="rf-need-guide-options">
                          <button
                            type="button"
                            onClick={() =>
                              chooseNeed(
                                "healthcare"
                              )
                            }
                          >
                            <span>
                              I&apos;ve noticed memory or behaviour changes
                            </span>

                            <strong>
                              Assessment & Healthcare →
                            </strong>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              chooseNeed(
                                "services"
                              )
                            }
                          >
                            <span>
                              I need help caring for someone day to day
                            </span>

                            <strong>
                              Support Services →
                            </strong>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              chooseNeed(
                                "financial"
                              )
                            }
                          >
                            <span>
                              I&apos;m worried about costs or government assistance
                            </span>

                            <strong>
                              Government & Financial →
                            </strong>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              chooseNeed(
                                "equipment"
                              )
                            }
                          >
                            <span>
                              I need something to make daily life safer or easier
                            </span>

                            <strong>
                              Equipment & Practical Aids →
                            </strong>
                          </button>
                        </div>
                      </div>
                    )}
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
                      <ResourceNeedIcon type={need} />
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
                      disabled={
                        !location ||
                        (need !== "healthcare" &&
                          directoryLoading)
                      }
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
                  {rf.resultsDesc ||
                    "These results are based on the choices you made above and published RCBC-managed directory records."}
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
                          {resource.verificationStatus === "example" ? "Example only" : resource.verificationStatus ===
                          "verified"
                            ? (rf.verified || "Verified")
                            : (rf.pendingVerification || "Pending verification")}
                        </span>

                        <button
                          type="button"
                          className="rf-details-toggle"
                          onClick={() =>
                            setExpandedResource(
                              expandedResource === resource.id
                                ? null
                                : resource.id
                            )
                          }
                          aria-expanded={
                            expandedResource === resource.id
                          }
                        >
                          {expandedResource === resource.id
                            ? "Hide details"
                            : "Show details"}
                          <span>
                            {expandedResource === resource.id ? "↑" : "↓"}
                          </span>
                        </button>
                      </div>

                      {expandedResource === resource.id && (
                        <div className="rf-result-details">
                          <div>
                            <span>Location</span>
                            <strong>
                              {[resource.address, resource.location, resource.state]
                                .filter(Boolean)
                                .join(", ")}
                            </strong>
                          </div>

                          <div>
                            <span>Phone</span>
                            <strong>{resource.phone || "Not provided"}</strong>
                          </div>

                          <div>
                            <span>Email</span>
                            <strong>{resource.email || "Not provided"}</strong>
                          </div>

                          <div>
                            <span>Eligibility</span>
                            <strong>{resource.eligibility || "Not provided"}</strong>
                          </div>

                          <div>
                            <span>Fees</span>
                            <strong>{resource.fees || "Not provided"}</strong>
                          </div>

                          <div>
                            <span>Source</span>
                            <strong>{resource.sourceLabel || "Not provided"}</strong>
                          </div>

                          <div>
                            <span>Review status</span>
                            <strong>{resource.reviewStatus || "Not provided"}</strong>
                          </div>

                          <LastReviewed value={resource.lastReviewed} />
                          {resource.website && (
                            <div className="rf-result-details-wide">
                              <span>Website</span>
                              <a
                                href={resource.website}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Visit published website ↗
                              </a>
                            </div>
                          )}
                        </div>
                      )}
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
                  {rf.emptyDesc ||
                    "No published database record currently matches this support type and location."}
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