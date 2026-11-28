import VolunteerRegistration from "./VolunteerRegistration";
import { CaregiverTopics } from "./CaregiverTopics";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import caregiverPhoto from "../assets/caregiver-support.jpg";
import learningPhoto from "../assets/learning-events.jpg";
import connectionPhoto from "../assets/Senior-citizens-chatting.png";
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


function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="caregiver-section-heading">
      <p className="caregiver-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <ReadMore text={description} />
    </div>
  );
}

function CaregiverSupport() {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const page = pathname.split("/").filter(Boolean)[1] || "overview";
  useEffect(() => {
    const legacyPath = {
      "#guidance": "/caregiver-support/guidance",
      "#training": "/caregiver-support/training",
      "#certificate-verification": "/caregiver-support",
      "#support-groups": "/caregiver-support/support-groups",
      "#volunteer": "/caregiver-support/volunteer",
    }[hash];
    if (page === "supporting-someone") {
      navigate({ pathname: "/caregiver-support/guidance", search, hash }, { replace: true });
    } else if (page === "overview" && new URLSearchParams(search).has("topic")) {
      navigate({ pathname: "/caregiver-support/guidance", search }, { replace: true });
    } else if (legacyPath && !(page === "guidance" && hash === "#guidance")) {
      navigate({ pathname: legacyPath, search }, { replace: true });
    }
  }, [page, search, hash, navigate]);
  const [activeTopic, setActiveTopic] = useState(() => guidanceTopics.find(topic => topic.id !== "self-care" && topic.id === new URLSearchParams(search).get("topic"))?.id || guidanceTopics[0].id);
  useEffect(() => {
    const topic = new URLSearchParams(search).get('topic');
    if (guidanceTopics.some(item => item.id === topic && item.id !== "self-care")) setActiveTopic(topic);
  }, [search]);

  const { t, translateLabel } = useLanguage();
  const cs = t.caregiverSupport;
  const m = t.header.menu;
  const d = t.caregiverDraft;
  const currentGuidanceTopics = (cs.guidanceTopics || guidanceTopics).filter(item => item.id !== "self-care").map(item => item.id === "communication" ? {...item, title:d.communication} : item);

  const topic =
    currentGuidanceTopics.find((item) => item.id === activeTopic) ?? currentGuidanceTopics[0];


  const pageLabels = {
    guidance: { title: m.caregiverGuidance, intro: cs.guidanceIntro },
    training: { title: m.caregiverTraining, intro: d.trainingIntro },
    wellbeing: { title: d.wellbeing, intro: d.wellbeingIntro },
    family: { title: d.family, intro: d.familyIntro },
    "support-groups": { title: m.supportGroups, intro: t.directory.groupIntro },
    volunteer: { title: d.volunteerTitle, intro: d.volunteerIntro },
  };

  return (
    <main className="caregiver-page">
      {page === "overview" ? (
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
              <Link className="caregiver-button caregiver-button-cream" to="/caregiver-support/guidance">
                {m.caregiverGuidance} <span aria-hidden="true">↗</span>
              </Link>
              <Link className="caregiver-hero-text-link" to="/caregiver-support/training">
                {m.caregiverTraining} <span aria-hidden="true">↗</span>
              </Link>
              <a className="caregiver-hero-text-link" href="#pathways">{d.pathways}<span aria-hidden="true">↓</span>
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
          <div className={`caregiver-container caregiver-subpage-grid${["guidance", "training", "wellbeing", "family", "support-groups"].includes(page) ? " has-photo" : ""}`}>
            <div>
              <Link className="caregiver-back-link" to="/caregiver-support"><span aria-hidden="true">←</span> {cs.title}</Link>
              <h1>{pageLabels[page]?.title}</h1>
              <ReadMore text={pageLabels[page]?.intro} />
            </div>
            {["guidance", "training", "wellbeing", "family", "support-groups"].includes(page) && <img className="caregiver-subpage-photo" src={page === "training" ? learningPhoto : ["guidance", "family"].includes(page) ? caregiverPhoto : connectionPhoto} alt="" />}
          </div>
        </section>
      )}

      {page === "overview" && (
        <section className="caregiver-section caregiver-pathways-section" id="pathways">
          <div className="caregiver-container">
            <div className="caregiver-intro-head"><h2>{d.pathways}</h2><p>{cs.lead}</p></div>
            {[
              [d.caringOthers, [[m.caregiverGuidance, "/caregiver-support/guidance", "⌂", cs.guidanceIntro], [m.caregiverTraining, "/caregiver-support/training", "▤", d.trainingIntro]]],
              [d.caringFamily, [[d.wellbeing, "/caregiver-support/wellbeing", "♡", d.wellbeingIntro], [d.family, "/caregiver-support/family", "◎", d.familyIntro]]],
              [d.connecting, [[m.supportGroups, "/caregiver-support/support-groups", "✳", t.directory.groupIntro], [m.volunteer, "/caregiver-support/volunteer", "✦", d.volunteerIntro]]],
            ].map(([heading, links], groupIndex) => (
              <div key={heading} className="caregiver-pathway-group">
                <div className="caregiver-group-heading"><span aria-hidden="true">0{groupIndex + 1}</span><h3>{heading}</h3></div>
                <div className="caregiver-pathways-pair">
                  {links.map(([label, path, symbol, description]) => (
                    <Link key={path} className="caregiver-pathway-card" to={path}>
                      <span className="caregiver-pathway-top"><span className="caregiver-number" aria-hidden="true">{symbol}</span><span aria-hidden="true">↗</span></span>
                      <h4>{label}</h4><p>{description}</p>
                      <span className="caregiver-card-action">{t.footer.explore} <span aria-hidden="true">→</span></span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
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
              <CaregiverTopics slug={`caregiver-guidance-${topic.id}`} />
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
            description={d.trainingIntro}
          />
          <div className="caregiver-training-grid caregiver-learning-options">
            <Link className="caregiver-training-card caregiver-learning-card" to="/learn-events/online-education">
              <span className="caregiver-learning-icon" aria-hidden="true">▷</span><h3>{d.webinars}</h3><p>{d.trainingIntro}</p>
              <span className="caregiver-card-action">{d.exploreWebinars} <span aria-hidden="true">→</span></span>
            </Link>
            <Link className="caregiver-training-card caregiver-learning-card" to="/learn-events/physical-education">
              <span className="caregiver-learning-icon" aria-hidden="true">▤</span><h3>{d.courses}</h3><p>{d.familyNotice}</p><p>{d.workerNotice}</p>
              <span className="caregiver-card-action">{d.exploreCourses} <span aria-hidden="true">→</span></span>
            </Link>
          </div>
        </div>
      </section>

      )}

      {page === "wellbeing" && <CaregiverTopics key="wellbeing" mode="wellbeing" />}
      {page === "family" && <CaregiverTopics key="family" mode="family" />}

      {page === "support-groups" && (
      <section
        className="caregiver-section caregiver-section-soft"
        id="support-groups"
      >
        <div className="caregiver-container">
          <SectionHeading
            eyebrow={cs.supportGroupsKicker || "03 / Support Groups"}
            title={d.findGroup}
            description={t.directory.groupIntro}
          />
          <DirectoryListings groupsOnly />
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
            {d.groupNotice}
          </p>
        </div>
      </section>

      )}

      {page === "volunteer" && <VolunteerRegistration />}

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
