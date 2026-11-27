import Trans from "../i18n/Trans";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import caregiverPhoto from "../assets/caregiver-support.jpg";
import "./CaregiverSupport.css";
import DirectoryListings from "../components/DirectoryListings";
import ReadMore from "../components/ReadMore/ReadMore";

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
      <ReadMore text={description} />
    </div>
  );
}

// Show RCBC's approved programme boundaries on both the main Caregiver Support
// page and the dedicated training page, so visitors cannot miss the notice.
function RcbcProgrammeNotice({ showTrainingLink = false }) {
  const {t,translateLabel}=useLanguage();
  const copy=t.caregiverSupport;
  return (
    <aside className="caregiver-rcbc-notice" aria-label={translateLabel('RCBC caregiver programme and platform information', "caregiverInfo")}>
      <strong>{copy.programmeNoticeTitle}</strong>
      <p>{copy.programmeFamilyNotice}</p>
      <p>{copy.programmeWorkerNotice}</p>
      <p>{copy.programmePlatformNotice}</p>
      {showTrainingLink && (
        <Link className="caregiver-rcbc-training-link" to="/caregiver-support/training">
          {copy.programmeDetailsLink} <span aria-hidden="true">→</span>
        </Link>
      )}
    </aside>
  );
}

function CaregiverSupport() {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const page = pathname.split("/").filter(Boolean)[1] || "guidance";
  useEffect(() => {
    const legacyPath = {
      "#guidance": "/caregiver-support",
      "#training": "/caregiver-support/training",
      "#certificate-verification": "/caregiver-support/certificate-verification",
      "#support-groups": "/caregiver-support/support-groups",
      "#volunteer": "/caregiver-support/volunteer",
    }[hash];
    if (legacyPath) navigate(legacyPath, { replace: true });
  }, [hash, navigate]);
  const [activeTopic, setActiveTopic] = useState(() => guidanceTopics.find(topic => topic.id === new URLSearchParams(search).get("topic"))?.id || guidanceTopics[0].id);
  useEffect(() => {
    const topic = new URLSearchParams(search).get('topic');
    if (guidanceTopics.some(item => item.id === topic)) setActiveTopic(topic);
  }, [search]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(0);
  const { t, translateLabel } = useLanguage();
  const cs = t.caregiverSupport;
  const m = t.header.menu;
  const currentGuidanceTopics = cs.guidanceTopics || guidanceTopics;

  const topic =
    currentGuidanceTopics.find((item) => item.id === activeTopic) ?? currentGuidanceTopics[0];
  const findVolunteerGroups = () => navigate("/caregiver-support/support-groups?volunteers=1");

  const pageLabels = {
    training: { title: m.caregiverTraining, intro: cs.trainingIntro },
    "certificate-verification": { title: m.certVerification, intro: cs.checkCertDesc },
    "support-groups": { title: m.supportGroups, intro: t.directory.groupIntro },
    volunteer: { title: m.volunteer, intro: cs.volunteerIntro },
  };

  return (
    <main className="caregiver-page">
      {page === "guidance" ? (
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
              <Link className="caregiver-hero-text-link" to="/caregiver-support/training">
                {m.caregiverTraining} <span aria-hidden="true">↗</span>
              </Link>
              <a className="caregiver-hero-text-link" href="#rcbc-programme-notice"><Trans id="caregiverProgramme">
                RCBC programme information </Trans><span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <div className="caregiver-hero-image-wrap">
            <img
              src={caregiverPhoto}
              alt={translateLabel("An older adult and caregiver preparing food together in a kitchen", "aboutCaregiverAlt")}
              className="caregiver-hero-image"
            />
            <div className="caregiver-hero-image-caption">
              <span aria-hidden="true">✦</span> {cs.caption || "Practical care. Shared understanding. Stronger communities."}
            </div>
          </div>
        </div>
      </section>

      ) : (
        <section className="caregiver-subpage-hero">
          <div className="caregiver-container">
            <p className="caregiver-eyebrow">{cs.eyebrow}</p>
            <h1>{pageLabels[page]?.title}</h1>
            <ReadMore text={pageLabels[page]?.intro} />
          </div>
        </section>
      )}

      {page === "guidance" && (
        <section className="caregiver-programme-intro" id="rcbc-programme-notice" aria-labelledby="rcbc-programme-heading">
          <div className="caregiver-container">
            <h2 id="rcbc-programme-heading"><Trans id="caregiverEducation">Caregiver education and future DCS–Worker training</Trans></h2>
            <RcbcProgrammeNotice showTrainingLink />
          </div>
        </section>
      )}

      {page === "guidance" && (
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
              aria-label={translateLabel('Caregiving guidance topics', "caregiverGuidance")}
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

      )}

      {page === "training" && (
      <section className="caregiver-section" id="training">
        <div className="caregiver-container">
          <SectionHeading
            eyebrow={cs.trainingKicker || "02 / Caregiver Training"}
            title={cs.trainingTitle || "Dementia Care Training"}
            description={cs.trainingIntro || "The DCS training pathway supports family caregiving now, with a further worker-focused programme planned for the future."}
          />
          <RcbcProgrammeNotice />
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
              <h3>{cs.dcsWorkerTitle || "DCS–Worker"} <small>{cs.workerPlannedLabel}</small></h3>
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
                {cs.workerAvailabilityNotice}
              </p>
            </article>
          </div>
          <div className="caregiver-training-path">
            <strong>{cs.learningPathway || "Learning pathway"}</strong>
            <span><Trans>DCS–Family</Trans></span>
            <span className="caregiver-path-arrow" aria-hidden="true">
              →
            </span>
            <span><Trans>
              DCS–Worker </Trans><small>{cs.workerApprovalLabel}</small>
            </span>
          </div>
        </div>
      </section>

      )}

      {page === "certificate-verification" && (
        <section className="caregiver-section" id="certificate-verification">
          <div className="caregiver-container">
            <SectionHeading
              eyebrow={cs.checkCertEyebrow || m.certVerification}
              title={cs.checkCertTitle || m.certVerification}
              description={cs.checkCertDesc}
            />
          <div className="caregiver-verification">
            <div className="caregiver-verification-intro">
              <h3>{cs.certVerificationTag || m.certVerification}</h3>
              <p>{cs.certReadyPrompt}</p>
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
      )}

      {page === "support-groups" && (
      <section
        className="caregiver-section caregiver-section-soft"
        id="support-groups"
      >
        <div className="caregiver-container">
          <SectionHeading
            eyebrow={cs.supportGroupsKicker || "03 / Support Groups"}
            title={cs.supportGroupsTitle || "Connection makes a difference"}
            description={t.directory.groupIntro}
          />
          <DirectoryListings key={search} groupsOnly initial={{ volunteers: new URLSearchParams(search).get('volunteers') === '1' }} />
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

      )}

      {page === "volunteer" && (
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
              aria-label={translateLabel('Types of volunteer organisations', "volunteerTypes")}
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
              <ReadMore text={(cs.volunteerTypes && cs.volunteerTypes[selectedVolunteer]?.description) || volunteerTypes[selectedVolunteer].description} />
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

      )}

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
