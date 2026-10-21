import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import caregiverPhoto from "../assets/caregiver-support.jpg";
import "./CaregiverSupport.css";

const guidanceTopics = [
  {
    id: "home-safety",
    number: "01",
    symbol: "⌂",
    title: "Home Safety Guide",
    preview: "Make familiar spaces easier and safer to navigate.",
    intro:
      "Small changes around the home can make daily life more comfortable and help reduce avoidable hazards.",
    tips: [
      "Keep walkways well lit and clear of loose rugs, clutter and trailing cables.",
      "Use clear signs or pictures on commonly used doors and cupboards when helpful.",
      "Store medicines, cleaning products and other potentially harmful items securely.",
      "Review changing safety needs with a healthcare professional or occupational therapist.",
    ],
  },
  {
    id: "daily-care",
    number: "02",
    symbol: "☀",
    title: "Daily Care",
    preview: "Build supportive routines for everyday activities.",
    intro:
      "A predictable routine can reduce uncertainty while preserving the person's choices and independence.",
    tips: [
      "Maintain a familiar daily rhythm for meals, activities and rest.",
      "Break complex activities into manageable steps and allow extra time.",
      "Offer simple choices and encourage the person to do what they comfortably can.",
      "Talk to a professional about new difficulties with eating, movement or personal care.",
    ],
  },
  {
    id: "communication",
    number: "03",
    symbol: "“",
    title: "Communication",
    preview: "Connect with patience, clarity and respect.",
    intro:
      "Communication may change over time. A calm, respectful approach can make conversations easier.",
    tips: [
      "Get the person's attention, make eye contact if comfortable and speak gently.",
      "Use short, clear sentences and ask one question at a time.",
      "Allow time for a response without rushing or correcting every mistake.",
      "Pay attention to facial expressions, gestures and other non-verbal cues.",
    ],
  },
  {
    id: "behaviour",
    number: "04",
    symbol: "↝",
    title: "Changes in Behaviour",
    preview: "Respond supportively when needs or behaviours change.",
    intro:
      "Behaviour changes can be a way of expressing discomfort, confusion or an unmet need.",
    tips: [
      "Stay calm and consider possible triggers such as noise, tiredness or discomfort.",
      "Look for patterns and adjust the environment or routine where possible.",
      "Offer reassurance and avoid arguing when someone is distressed.",
      "Seek medical advice for sudden or significant changes in behaviour.",
    ],
  },
  {
    id: "activities",
    number: "05",
    symbol: "✦",
    title: "Activities at Home",
    preview: "Keep meaningful interests part of the day.",
    intro:
      "Enjoyable activities can support connection, confidence and a sense of purpose.",
    tips: [
      "Choose activities that reflect the person's interests and abilities.",
      "Try familiar music, photos, gardening or simple shared household tasks.",
      "Adapt activities to avoid frustration and focus on enjoyment, not performance.",
      "Include opportunities for rest and social connection.",
    ],
  },
  {
    id: "self-care",
    number: "06",
    symbol: "♡",
    title: "Caregiver Self-Care",
    preview: "Look after your own wellbeing while providing care.",
    intro:
      "Caregivers also need time, understanding and support. Seeking help is part of sustainable care.",
    tips: [
      "Make room for rest, meals, movement and activities you enjoy.",
      "Share responsibilities with trusted people where possible.",
      "Talk with friends, family or a peer support group about how you're doing.",
      "Ask about respite and professional support when responsibilities become difficult to manage.",
    ],
  },
];

// Directory entries use the backend's snake_case field names (including languages[]).
const supportGroupsUrl = "/api/public/organisations?category=support-group";

const volunteerTypes = [
  {
    title: "Support groups",
    description:
      "Help community groups organise inclusive gatherings and peer support activities.",
  },
  {
    title: "Registered NGOs",
    description:
      "Contribute to outreach, educational events and community programmes.",
  },
  {
    title: "Elderly homes & care facilities",
    description:
      "Explore opportunities offered directly by facilities that accept volunteers.",
  },
  {
    title: "Other approved organisations",
    description:
      "Find community-based activities with organisations accepted by the platform.",
  },
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="caregiver-section-heading">
      <p className="caregiver-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function CaregiverSupport() {
  const { hash } = useLocation();
  const [activeTopic, setActiveTopic] = useState(guidanceTopics[0].id);
  const [city, setCity] = useState("");
  const [language, setLanguage] = useState("");
  const [volunteerOnly, setVolunteerOnly] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(0);
  const [supportGroups, setSupportGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState("");
  const [reloadGroups, setReloadGroups] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setGroupsLoading(true);
    setGroupsError("");
    fetch(supportGroupsUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            "Support groups could not be loaded. Please try again.",
          );
        }
        const data = await response.json();
        if (!Array.isArray(data))
          throw new Error("Unexpected support-group response.");
        return data;
      })
      .then((data) => {
        if (!controller.signal.aborted) setSupportGroups(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setGroupsError(
            error.message || "Support groups could not be loaded.",
          );
          setSupportGroups([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setGroupsLoading(false);
      });
    return () => controller.abort();
  }, [reloadGroups]);

  // Supports direct links from the header and former caregiver URLs.
  useEffect(() => {
    if (!hash) return undefined;
    const target = decodeURIComponent(hash.slice(1));
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  const { t } = useLanguage();
  const cs = t.caregiverSupport;
  const m = t.header.menu;
  const currentGuidanceTopics = cs.guidanceTopics || guidanceTopics;

  const topic =
    currentGuidanceTopics.find((item) => item.id === activeTopic) ?? currentGuidanceTopics[0];
  const availableLanguages = useMemo(
    () =>
      [
        ...new Set(
          supportGroups.flatMap((group) =>
            Array.isArray(group.languages) ? group.languages : [],
          ),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [supportGroups],
  );
  const filteredGroups = useMemo(
    () =>
      supportGroups.filter(
        (group) =>
          (!city ||
            (group.city || "")
              .toLowerCase()
              .includes(city.trim().toLowerCase())) &&
          (!language ||
            (Array.isArray(group.languages) &&
              group.languages.some(
                (item) => item.toLowerCase() === language.toLowerCase(),
              ))) &&
          (!volunteerOnly || group.accepting_volunteers === true),
      ),
    [supportGroups, city, language, volunteerOnly],
  );

  const resetFilters = () => {
    setCity("");
    setLanguage("");
    setVolunteerOnly(false);
  };

  const findVolunteerGroups = () => {
    setVolunteerOnly(true);
    document
      .getElementById("support-groups")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="caregiver-page">
      <section className="caregiver-hero" aria-labelledby="caregiver-title">
        <div className="caregiver-container caregiver-hero-grid">
          <div className="caregiver-hero-copy">
            <p className="caregiver-eyebrow">{cs.eyebrow}</p>
            <h1 id="caregiver-title">
              {cs.title}
            </h1>
            <p className="caregiver-hero-intro">
              {cs.lead}
            </p>
            <div className="caregiver-hero-actions">
              <a
                className="caregiver-button caregiver-button-cream"
                href="#guidance"
              >
                {m.caregiverGuidance} <span aria-hidden="true">↗</span>
              </a>
              <a className="caregiver-hero-text-link" href="#training">
                {m.caregiverTraining} <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <div className="caregiver-hero-image-wrap">
            <img
              src={caregiverPhoto}
              alt="An older adult and caregiver preparing food together in a kitchen"
              className="caregiver-hero-image"
            />
            <div className="caregiver-hero-image-caption">
              <span aria-hidden="true">✦</span> {cs.caption || "Practical care. Shared understanding. Stronger communities."}
            </div>
          </div>
        </div>
      </section>

      <nav className="caregiver-on-page" aria-label="On this page">
        <div className="caregiver-container caregiver-on-page-inner">
          <span>{t.header.overview}</span>
          <a href="#guidance">{m.caregiverGuidance}</a>
          <a href="#training">{m.caregiverTraining}</a>
          <a href="#support-groups">{m.supportGroups}</a>
          <a href="#volunteer">{m.volunteer}</a>
        </div>
      </nav>

      <section className="caregiver-section caregiver-section-intro">
        <div className="caregiver-container">
          <div className="caregiver-intro-head">
            <div>
              <p className="caregiver-eyebrow">{cs.startingPointKicker || "Find your starting point"}</p>
              <h2>{cs.startingPointHeading || "What kind of support do you need today?"}</h2>
            </div>
            <p>
              {cs.startingPointSub || "Choose a pathway to learn practical skills, connect with others or give your time to the community."}
            </p>
          </div>
          <div className="caregiver-pathway-grid">
            {(cs.pathways || [
              {
                number: "01",
                title: "Caregiver Guidance",
                text: "Everyday advice for caring for someone at home.",
                target: "guidance",
              },
              {
                number: "02",
                title: "Caregiver Training",
                text: "Learn about DCS–Family and the future DCS–Worker pathway.",
                target: "training",
              },
              {
                number: "03",
                title: "Support Groups",
                text: "Find published groups by city, language and volunteer availability.",
                target: "support-groups",
              },
              {
                number: "04",
                title: "Volunteer",
                text: "Discover ways to contribute through organisations.",
                target: "volunteer",
              },
            ]).map((item) => (
              <a
                className="caregiver-pathway-card"
                key={item.number}
                href={`#${item.target}`}
              >
                <span className="caregiver-pathway-top">
                  <span className="caregiver-number">{item.number}</span>
                  <span aria-hidden="true">↗</span>
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span className="caregiver-card-action">
                  {cs.exploreSection || "Explore section"} <span aria-hidden="true">→</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section
        className="caregiver-section caregiver-section-soft"
        id="guidance"
      >
        <div className="caregiver-container">
          <SectionHeading
            eyebrow={cs.guidanceKicker || "01 / Practical Guidance"}
            title={cs.guidanceTitle || "Practical support for everyday care"}
            description={cs.guidanceIntro || "Choose a topic to explore ideas you can adapt to the needs, preferences and abilities of the person you support."}
          />
          <div className="caregiver-guidance-layout">
            <div
              className="caregiver-guidance-menu"
              role="group"
              aria-label="Caregiving guidance topics"
            >
              {currentGuidanceTopics.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`caregiver-guidance-option${item.id === activeTopic ? " is-active" : ""}`}
                  onClick={() => setActiveTopic(item.id)}
                  aria-pressed={item.id === activeTopic}
                  aria-controls="caregiver-guidance-detail"
                >
                  <span
                    className="caregiver-guidance-symbol"
                    aria-hidden="true"
                  >
                    {item.symbol}
                  </span>
                  <span className="caregiver-guidance-option-text">
                    <strong>{item.title}</strong>
                    <small>{item.preview}</small>
                  </span>
                  <span className="caregiver-guidance-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              ))}
            </div>
            <article
              id="caregiver-guidance-detail"
              className="caregiver-guidance-detail"
              aria-live="polite"
            >
              <span className="caregiver-detail-label">
                {cs.careGuideLabel || "CARE GUIDE"} / {topic.number}
              </span>
              <span className="caregiver-detail-symbol" aria-hidden="true">
                {topic.symbol}
              </span>
              <h3>{topic.title}</h3>
              <p className="caregiver-detail-intro">{topic.intro}</p>
              <h4>{cs.startingPointsTitle || "Helpful starting points"}</h4>
              <ul className="caregiver-check-list">
                {topic.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
              <div className="caregiver-detail-note">
                {cs.guidanceDisclaimer || "Every person is different. Adapt these general tips to their situation, and consult a qualified professional when needed."}
              </div>
            </article>
          </div>
          <div className="caregiver-crosslink">
            <div>
              <strong>
                {cs.crosslinkTitle || "Need professional services or practical equipment?"}
              </strong>
              <p>
                {cs.crosslinkText || "Healthcare assessments, respite care, residential facilities and equipment directories belong in Find Help & Support."}
              </p>
            </div>
            <Link to="/find-help">
              {cs.crosslinkBtn || "Find Help & Support"} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="caregiver-section" id="training">
        <div className="caregiver-container">
          <SectionHeading
            eyebrow={cs.trainingKicker || "02 / Caregiver Training"}
            title={cs.trainingTitle || "Dementia Care Training"}
            description={cs.trainingIntro || "The DCS training pathway supports family caregiving now, with a further worker-focused programme planned for the future."}
          />
          <div className="caregiver-training-grid">
            <article className="caregiver-training-card caregiver-training-current">
              <span className="caregiver-status">{cs.currentProgram || "Current programme"}</span>
              <span className="caregiver-training-step">{cs.step1 || "STEP 01"}</span>
              <h3>{cs.dcsFamilyTitle || "DCS–Family"}</h3>
              <p>
                {cs.dcsFamilyDesc || "Designed for family members and individuals learning to care for someone in their own family."}
              </p>
              <ul>
                {(cs.dcsFamilyBullets || [
                  "Knowledge and practical understanding for family caregiving",
                  "Certificate upon completion according to programme requirements",
                  "CPD points according to the applicable programme arrangement",
                ]).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <p className="caregiver-training-footnote">
                {cs.dcsFamilyFootnote || "This is not a professional caregiver qualification."}
              </p>
              <Link
                className="caregiver-text-action"
                to="/learn-events/upcoming-calendar"
              >
                {cs.viewClasses || "View upcoming classes"} <span aria-hidden="true">↗</span>
              </Link>
            </article>
            <article className="caregiver-training-card caregiver-training-future">
              <span className="caregiver-status caregiver-status-muted">
                {cs.plannedFuture || "Planned for the future"}
              </span>
              <span className="caregiver-training-step">{cs.step2 || "STEP 02"}</span>
              <h3>{cs.dcsWorkerTitle || "DCS–Worker"}</h3>
              <p>
                {cs.dcsWorkerDesc || "A planned progression for people interested in developing skills to care for others."}
              </p>
              <ul>
                {(cs.dcsWorkerBullets || [
                  "DCS–Family completion is the prerequisite",
                  "Greater emphasis on practical, hands-on caregiving skills",
                  "Certificate and CPD points subject to programme requirements and arrangements",
                ]).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <p className="caregiver-training-footnote">
                {cs.dcsWorkerFootnote || "DCS–Worker is not yet listed as an available course."}
              </p>
            </article>
          </div>
          <div className="caregiver-training-path">
            <strong>{cs.learningPathway || "Learning pathway"}</strong>
            <span>DCS–Family</span>
            <span className="caregiver-path-arrow" aria-hidden="true">
              →
            </span>
            <span>
              DCS–Worker <small>{cs.futureTag || "(future)"}</small>
            </span>
          </div>
          <div className="caregiver-verification" id="certificate-verification">
            <div className="caregiver-verification-intro">
              <p className="caregiver-eyebrow">{cs.checkCertEyebrow || "Certificate Verification"}</p>
              <h3>{cs.checkCertTitle || "Check a DCS certificate"}</h3>
              <p>
                {cs.checkCertDesc || "Verify a DCS programme certificate using the participant's name and certificate reference through the existing secure verification page."}
              </p>
            </div>
            <div className="caregiver-verification-preview">
              <span className="caregiver-preview-tag">
                {cs.certVerificationTag || "CERTIFICATE VERIFICATION"}
              </span>
              <p>
                {cs.certReadyPrompt || "Have the name shown on the certificate and the certificate reference ready."}
              </p>
              <Link
                className="caregiver-button caregiver-button-green"
                to="/caregiver-support/verify-certificate"
              >
                {cs.verifyCertBtn || "Verify a certificate"} <span aria-hidden="true">↗</span>
              </Link>
              <small>
                {cs.certNotice || "Only programme completion is verified; this is not a professional licence."}
              </small>
            </div>
          </div>
          <p className="caregiver-disclaimer">
            {cs.certDisclaimer || "Certificate verification confirms completion of the stated DCS programme only. It is not professional licensing, an employment endorsement, a guarantee of service quality or a recommendation by RCBC."}
          </p>
        </div>
      </section>

      <section
        className="caregiver-section caregiver-section-soft"
        id="support-groups"
      >
        <div className="caregiver-container">
          <SectionHeading
            eyebrow={cs.supportGroupsKicker || "03 / Support Groups"}
            title={cs.supportGroupsTitle || "Connection makes a difference"}
            description={cs.supportGroupsIntro || "Find published support groups by city, language and volunteer availability. Only records approved for publication appear here."}
          />
          <div className="caregiver-directory">
            <div className="caregiver-directory-head">
              <div>
                <h3>{cs.findSupportGroup || "Find a support group"}</h3>
                <p>{cs.searchApproved || "Search the approved group directory."}</p>
              </div>
              <span className="caregiver-directory-count">
                {groupsLoading
                  ? (cs.loadingGroups || "Loading groups…")
                  : groupsError
                    ? (cs.unavailable || "Unavailable")
                    : `${filteredGroups.length} ${cs.listingsCount || "listings"}`}
              </span>
            </div>
            <div className="caregiver-filter-grid">
              <label>
                {cs.cityLocation || "City / location"}
                <input
                  type="search"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder={cs.cityPlaceholder || "e.g. Kuching"}
                />
              </label>
              <label>
                {t.learnEvents?.language || "Language"}
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  <option value="">{cs.allLanguages || "All languages"}</option>
                  {availableLanguages.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="caregiver-filter-footer">
              <label className="caregiver-filter-check">
                <input
                  type="checkbox"
                  checked={volunteerOnly}
                  onChange={(event) => setVolunteerOnly(event.target.checked)}
                />{" "}
                {cs.acceptingVolunteers || "Accepting volunteers only"}
              </label>
              <button
                type="button"
                className="caregiver-clear-button"
                onClick={resetFilters}
              >
                {cs.clearFilters || "Clear filters"}
              </button>
            </div>
            {groupsLoading ? (
              <div className="caregiver-empty-state" role="status">
                <h4>Loading support groups…</h4>
                <p>Checking the latest published listings.</p>
              </div>
            ) : groupsError ? (
              <div className="caregiver-empty-state" role="alert">
                <h4>Unable to load support groups</h4>
                <p>{groupsError}</p>
                <button
                  type="button"
                  className="caregiver-text-action"
                  onClick={() => setReloadGroups((n) => n + 1)}
                >
                  Try again →
                </button>
              </div>
            ) : filteredGroups.length > 0 ? (
              <div className="caregiver-results" aria-live="polite">
                {filteredGroups.map((group) => (
                  <article className="caregiver-result-card" key={group.id}>
                    <span className="caregiver-result-approved">
                      {cs.reviewedListing || "Published listing"}
                    </span>
                    <h4>{group.name}</h4>
                    {group.city && (
                      <p>
                        <strong>City:</strong> {group.city}
                      </p>
                    )}
                    <p>
                      <strong>Languages:</strong>{" "}
                      {Array.isArray(group.languages) && group.languages.length
                        ? group.languages.join(", ")
                        : "Not specified"}
                    </p>
                    <p>
                      <strong>Accepting volunteers:</strong>{" "}
                      {group.accepting_volunteers ? "Yes" : "No"}
                    </p>
                    {group.email && (
                      <a href={`mailto:${group.email}`}>{cs.emailOrganisation || "Email organisation"}</a>
                    )}
                    {group.website && /^https?:\/\//i.test(group.website) && (
                      <a
                        href={group.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {cs.officialWebsite || "Official website ↗"}
                      </a>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="caregiver-empty-state" role="status">
                <span className="caregiver-empty-symbol" aria-hidden="true">
                  ⌕
                </span>
                <h4>
                  {supportGroups.length === 0
                    ? (cs.emptyComingSoon || "No published support groups yet")
                    : (cs.emptyNoMatch || "No groups match these filters")}
                </h4>
                <p>
                  {supportGroups.length === 0
                    ? (cs.emptyComingSoonDesc || "There are no support-group listings currently published in the directory.")
                    : (cs.emptyNoMatchDesc || "Try another city or language, or clear the volunteer filter.")}
                </p>
                {supportGroups.length > 0 && (
                  <button
                    type="button"
                    className="caregiver-text-action"
                    onClick={resetFilters}
                  >
                    {cs.resetSearch || "Reset search →"}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="caregiver-listing-note">
            <div>
              <strong>{cs.partOfGroup || "Are you part of a support group or NGO?"}</strong>
              <p>
                {cs.partOfGroupDesc || "Organisations can contact the project team about listing their group. Submissions are reviewed and require admin approval before publication."}
              </p>
            </div>
            <Link to="/about/contact">
              {cs.contactTeam || "Contact the project team →"}
            </Link>
          </div>
          <p className="caregiver-disclaimer">
            {cs.groupDisclaimer || "A reviewed listing means basic information has been checked against platform requirements. Listing does not mean RCBC endorses, recommends or guarantees an organisation."}
          </p>
        </div>
      </section>

      <section className="caregiver-section" id="volunteer">
        <div className="caregiver-container">
          <SectionHeading
            eyebrow={cs.volunteerKicker || "04 / Volunteer"}
            title={cs.volunteerTitle || "Support the Project"}
            description={cs.volunteerIntro || "Volunteers connect directly with participating community organisations. Each receiving organisation manages its own applications, orientation and supervision."}
          />
          <div className="caregiver-volunteer-layout">
            <div
              className="caregiver-volunteer-choices"
              role="group"
              aria-label="Types of volunteer organisations"
            >
              {volunteerTypes.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className={`caregiver-volunteer-option${selectedVolunteer === index ? " is-active" : ""}`}
                  onClick={() => setSelectedVolunteer(index)}
                  aria-pressed={selectedVolunteer === index}
                  aria-controls="caregiver-volunteer-detail"
                >
                  <span className="caregiver-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{(cs.volunteerTypes && cs.volunteerTypes[index]?.title) || item.title}</span>
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <div
              id="caregiver-volunteer-detail"
              className="caregiver-volunteer-detail"
              aria-live="polite"
            >
              <span className="caregiver-detail-label">
                {cs.volunteerHeader || "VOLUNTEER WITH AN ORGANISATION"}
              </span>
              <h3>{(cs.volunteerTypes && cs.volunteerTypes[selectedVolunteer]?.title) || volunteerTypes[selectedVolunteer].title}</h3>
              <p>{(cs.volunteerTypes && cs.volunteerTypes[selectedVolunteer]?.description) || volunteerTypes[selectedVolunteer].description}</p>
              <ol className="caregiver-volunteer-steps">
                {(cs.volunteerSteps || [
                  "Find a relevant organisation or opportunity.",
                  "Contact or apply directly to the receiving organisation.",
                  "The organisation handles acceptance, role arrangements, orientation and supervision.",
                ]).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <button
                type="button"
                className="caregiver-button caregiver-button-green"
                onClick={findVolunteerGroups}
              >
                {cs.findVolunteerGroupsBtn || "Find groups accepting volunteers →"}
              </button>
              <p className="caregiver-volunteer-small">
                {cs.volunteerSmallText || "Facility and service directories remain under"}{" "}
                <Link to="/find-help/support-services">
                  {cs.findHelpBtn || "Find Help & Support"}
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="caregiver-volunteer-terms">
            <h3>{cs.beforeYouVolunteer || "Before you volunteer"}</h3>
            <ul>
              {(cs.volunteerTerms || [
                "Volunteering is primarily unpaid. Personal costs are outside RCBC's responsibility unless separately agreed with the organisation.",
                "The receiving organisation decides on onboarding, orientation, safety requirements and suitability for a role.",
                "When applying, you may be asked for contact details, location, languages, interests, availability, optional experience and a basic declaration of physical suitability for the activity.",
                "RCBC does not employ, assign or pay volunteers through this platform, or arrange private one-to-one caregiving placements.",
              ]).map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="caregiver-final-cta">
        <div className="caregiver-container caregiver-final-cta-inner">
          <div>
            <p className="caregiver-eyebrow">{cs.stillLookingEyebrow || "Still looking for something?"}</p>
            <h2>{cs.stillLookingTitle || "Support is a shared journey."}</h2>
            <p>
              {cs.stillLookingDesc || "Explore professional services, equipment and additional learning resources, or get in touch with the project team."}
            </p>
          </div>
          <div className="caregiver-final-actions">
            <Link to="/find-help">{cs.findHelpBtn || "Find Help & Support →"}</Link>
            <Link to="/about/contact">{cs.contactUsBtn || "Contact Us →"}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CaregiverSupport;
