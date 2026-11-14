import PublishedRecords from "../components/PublishedRecords";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./UnderstandDementia.css";

const understandingDementiaContent = {
  eyebrow: "Understanding Dementia",
  title: "Understanding Dementia",
  lead: "Learn about dementia, changes to look out for, and ways to support brain health and wellbeing.",
  exploreEarly: "Explore early signs",
  healthyActive: "Healthy living",
  keyPoints: "Key points",
  keyPointsList: [
    "Dementia is not a normal part of ageing.",
    "Different conditions can cause dementia symptoms.",
    "A healthcare professional can help assess changes in memory or thinking.",
  ],
  overview: "Overview",
  earlySigns: "Early signs",
  faq: "FAQs",
  basics: "The basics",
  whatIs: "What is dementia?",
  overviewIntro:
    "Dementia describes symptoms that affect memory, thinking, communication and everyday activities.",
  overviewCards: [
    {
      title: "Understanding dementia",
      text: "Dementia is an umbrella term for symptoms caused by conditions affecting the brain.",
    },
    {
      title: "Alzheimer's disease",
      text: "Alzheimer's disease is one of the most common causes of dementia.",
    },
    {
      title: "Different experiences",
      text: "Symptoms and progression vary between individuals and types of dementia.",
    },
  ],
  overviewDetails: [
    "Dementia is not a single disease. It describes a group of symptoms that can affect memory, reasoning, language and the ability to manage everyday tasks. Different underlying conditions can cause these changes. A healthcare professional can help investigate persistent concerns.",
    "Alzheimer's disease is a common cause of dementia, but the terms are not interchangeable. It generally develops gradually, and people may experience changes in memory, communication and daily activities over time. Assessment and support can help individuals and families plan for their needs.",
    "Dementia affects people differently. The changes someone experiences, how quickly they develop and the support they need can vary. Listening to the person, respecting their preferences and adapting support to their situation are important.",
  ],
  commonTypesTitle: "Common types of dementia",
  commonTypesIntro:
    "Dementia is an umbrella term. These are some of the conditions that can cause dementia symptoms:",
  commonTypes: [
    {
      title: "Alzheimer’s disease",
      description:
        "Often involves gradual changes in memory, thinking and everyday functioning.",
    },
    {
      title: "Vascular dementia",
      description:
        "Linked to problems with blood supply to the brain; symptoms can include difficulties with planning and thinking.",
    },
    {
      title: "Lewy body dementia",
      description:
        "May involve changes in attention, movement, sleep and visual perception.",
    },
    {
      title: "Frontotemporal dementia",
      description:
        "Often affects behaviour, personality or language, sometimes before memory changes become obvious.",
    },
  ],
  youngerOnset: "Younger-onset dementia:",
  youngerText: "Dementia can sometimes affect people under 65.",
  signsEyebrow: "Recognising changes",
  signsTitle: "Early signs and changes",
  signsIntro:
    "Occasional forgetfulness is common. Persistent changes that interfere with daily life deserve professional assessment.",
  comparisonLabel:
    "Comparison of everyday changes and potentially concerning changes",
  comparisonHead: [
    "Common everyday changes",
    "Changes worth discussing with a professional",
  ],
  comparison: [
    [
      "Occasionally forgetting a name",
      "Frequently forgetting recently learned information",
    ],
    [
      "Sometimes misplacing belongings",
      "Repeatedly losing items and struggling to retrace steps",
    ],
    [
      "Occasionally needing help with a new task",
      "Difficulty completing familiar everyday tasks",
    ],
    [
      "Occasionally losing track of the day",
      "Frequent confusion about time or place",
    ],
  ],
  selfAssessmentEyebrow: "Reflection",
  selfAssessmentTitle: "Notice changes in daily life",
  selfAssessmentIntro:
    "These questions are for reflection only. They are not a medical test or diagnosis.",
  questions: [
    "Have you noticed recurring memory difficulties?",
    "Have familiar tasks become more difficult?",
    "Have you noticed recurring confusion about time or place?",
    "Have communication or word-finding difficulties become more frequent?",
  ],
  options: ["Never", "Sometimes", "Often"],
  answered: "answered",
  viewGuidance: "View guidance",
  answerAll: "Answer every question to continue.",
  resultTitle: "General guidance",
  considerTitle: "Consider seeking advice.",
  considerText:
    "If changes are persistent or affecting everyday life, speak with a healthcare professional.",
  observeTitle: "Pay attention to changes.",
  observeText:
    "Consider recording concerns and discussing them with a healthcare professional.",
  wellbeingTitle: "Keep supporting wellbeing.",
  wellbeingText:
    "Healthy routines and social connections can support overall wellbeing. Seek advice about any concerns.",
  findHelp: "Find healthcare support",
  healthcareLink: "Healthcare information",
  startAgain: "Start again",
  disclaimer:
    "This questionnaire cannot diagnose or rule out dementia. A qualified healthcare professional can assess symptoms.",
  livingEyebrow: "Everyday wellbeing",
  livingTitle: "Healthy and active living",
  livingIntro:
    "Healthy routines can support general wellbeing and brain health.",
  livingCards: [
    {
      title: "Stay Healthy",
      items: [
        "Have regular checks for blood pressure and diabetes, and manage them with your healthcare team.",
        "Check hearing and vision, and seek support when they change.",
        "Avoid smoking and limit alcohol; protect yourself from head injuries.",
        "Make sleep and balanced meals part of your routine.",
      ],
    },
    {
      title: "Stay Active",
      items: [
        "Choose enjoyable activities such as walking, dancing or gardening.",
        "Make movement part of daily life in ways that suit your abilities.",
      ],
    },
    {
      title: "Stay Connected & Engaged",
      items: [
        "Spend time with family, friends and neighbours.",
        "Join community, cultural or volunteering activities that interest you.",
      ],
    },
    {
      title: "Keep Your Brain & Mind Active",
      items: [
        "Explore hobbies, reading, music or learning something new.",
        "Try activities that encourage thinking, creativity and conversation.",
      ],
    },
  ],
  riskTitle: "Dementia Risk Reduction",
  riskDescription:
    "Looking after heart health, hearing and vision, staying active and connected, avoiding smoking and harmful alcohol use, preventing head injuries, and getting enough sleep may help reduce the risk of dementia. No single habit can eliminate the risk, and healthy living cannot guarantee prevention.",
  learnTogether: "Learn and connect",
  learnTogetherText:
    "Explore education and community activities for people and families.",
  learnEvents: "Learn and events",
  riskNote:
    "Healthy habits support wellbeing but cannot guarantee prevention of dementia.",
  faqEyebrow: "Common questions",
  faqTitle: "Frequently asked questions",
  faqIntro: "Answers to common questions about dementia and support.",
  faqs: [
    {
      q: "Is dementia a normal part of ageing?",
      a: "No. Dementia is not a normal part of ageing, although age can increase risk.",
      link: { href: "#overview", label: "Learn about dementia" },
    },
    {
      q: "Is dementia the same as Alzheimer's disease?",
      a: "No. Alzheimer's disease is one cause of dementia, but there are others.",
      link: { href: "#common-types", label: "See common types" },
    },
    {
      q: "Can dementia be diagnosed through an online questionnaire?",
      a: "No. A qualified healthcare professional must assess symptoms.",
      link: { href: "#early-signs", label: "See early signs" },
    },
    {
      q: "What should I do if I notice changes?",
      a: "Speak with a healthcare professional if changes persist or affect everyday life.",
      link: {
        href: "/find-help/assessment-healthcare",
        label: "Find assessment information",
      },
    },
    {
      q: "Where can caregivers find help?",
      a: "Caregiver Support offers practical guidance, training and community connections.",
      link: { href: "/caregiver-support", label: "Explore caregiver support" },
    },
    {
      q: "Can younger people develop dementia?",
      a: "Yes. Dementia can affect people under 65, although it is less common.",
      link: { href: "#overview", label: "Read the overview" },
    },
    {
      q: "Is dementia hereditary?",
      a: "Most cases are not directly inherited, but some rare forms have strong genetic links.",
      link: { href: "#common-types", label: "Explore dementia types" },
    },
    {
      q: "Can dementia risk be reduced?",
      a: "Some risk factors can be managed through health care and everyday habits.",
      link: { href: "#risk-reduction", label: "Explore risk reduction" },
    },
    {
      q: "Can healthy living prevent dementia?",
      a: "Healthy habits may reduce risk, but they cannot guarantee prevention.",
      link: { href: "#healthy-living", label: "Healthy and active living" },
    },
    {
      q: "When should I seek further assessment?",
      a: "Seek professional advice if changes are persistent, worsening or affecting daily life.",
      link: {
        href: "/find-help/assessment-healthcare",
        label: "Find assessment information",
      },
    },
  ],
  concerned: "Need more support?",
  visitFindHelp: "Find help and support",
};

// Each approved section can be edited by RCBC in Admin > Records > Content pages.
// Use these slugs and publish only reviewed material. Otherwise show neutral copy.
const LIVING_SECTIONS = [
  {
    slug: "healthy-stay-healthy", title: "Stay Healthy",
    description: "Explore RCBC education on ageing and general wellbeing.",
    webinarTitle: "A Practical Webinar on Cataracts", webinarQuery: "Cataracts",
  },
  {
    slug: "healthy-stay-active", title: "Stay Active",
    description: "Explore educational sessions about activity and everyday wellbeing.",
    webinarTitle: "Embracing Wellness: Ageing with Dignity in Sarawak", webinarQuery: "Embracing Wellness",
  },
  {
    slug: "healthy-stay-connected", title: "Stay Connected & Engaged",
    description: "Explore RCBC sessions about connection and community involvement.",
    webinarTitle: "Alzheimer's Awareness Webinar", webinarQuery: "Alzheimer's Awareness",
  },
  {
    slug: "healthy-mind-active", title: "Keep Your Brain & Mind Active",
    description: "Explore webinars about learning, awareness and wellbeing.",
    webinarTitle: "Alzheimer's 101: Eye-opening facts", webinarQuery: "Alzheimer's 101",
  },
];

function UnderstandDementia() {
  const { hash } = useLocation();

  // Scroll after React Router has rendered the target, including links from
  // other pages and the browser's Back/Forward navigation.
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return undefined;
    }
    const targetId = decodeURIComponent(hash.slice(1));
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
        });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  const { t: translationsData, language } = useLanguage();
  const rawT = translationsData.understandDementia || {};
  const t = {
    ...understandingDementiaContent,
    ...rawT,
    commonTypes: rawT.commonTypes || understandingDementiaContent.commonTypes,
    commonTypesTitle: rawT.commonTypesTitle || understandingDementiaContent.commonTypesTitle,
    commonTypesIntro: rawT.commonTypesIntro || understandingDementiaContent.commonTypesIntro,
    riskTitle: rawT.riskTitle || understandingDementiaContent.riskTitle,
    riskDescription: rawT.riskDescription || understandingDementiaContent.riskDescription,
    faqs: (rawT.faqs || understandingDementiaContent.faqs).map((faq, idx) => ({
      ...understandingDementiaContent.faqs[idx],
      ...faq,
      link: faq.link || understandingDementiaContent.faqs[idx]?.link,
    })),
  };
  // New RCBC copy is intentionally in English pending RCBC approval of translations.
  const reviewCopy = {
    normalTitle: "Normal Ageing",
    normalIntro: "Occasional forgetfulness can happen in everyday life. Dementia is not a normal part of ageing.",
    normalNote: "These examples are for general information. They cannot confirm or rule out a condition.",
    changesTitle: "Concerning Changes",
    earlyTitle: "Early Signs",
    earlyIntro: "Some changes in memory, communication or everyday activities may be worth discussing with a healthcare professional.",
    earlyNote: "There is no single checklist that can tell whether someone has dementia.",
    earlyExamples: ["Repeated changes in memory or thinking", "Growing difficulty with familiar activities or communication", "More frequent confusion about time or place"],
    selfCheckTitle: "Self-Assessment",
    selfCheckIntro: "This is a guide to help you think about changes. It is not a screening test, medical advice or a diagnosis.",
    guideNotice: "For reference only — not a diagnosis.",
    guideReminder: "These answers cannot diagnose or rule out dementia. If changes concern you, seek advice from a qualified healthcare professional.",
    generalGuidance: "Your answers are a personal reflection, not a medical result or risk score. If you have concerns, consider speaking with a qualified healthcare professional, whatever your answers were.",
    professionalTitle: "Professional Assessment",
    professionalIntro: "If changes are ongoing, worrying or affect daily life, a qualified healthcare professional can discuss your concerns and advise on assessment. This website cannot determine the cause.",
    furtherTitle: "Further Care",
    furtherIntro: "Explore practical caregiver information and community support. A person's situation and preferences should guide any next steps.",
    caregiverLink: "Explore Caregiver Support",
    webinarLink: "Explore education and webinars",
    healthNote: "RCBC will review and update educational content before publication. These sections link to the existing webinar archive rather than offering personal medical advice.",
  };
  const [publishedLivingCopy, setPublishedLivingCopy] = useState({});
  useEffect(() => {
    let active = true;
    fetch("/api/public/content_pages")
      .then((response) => response.ok ? response.json() : [])
      .then((records) => {
        if (!active || !Array.isArray(records)) return;
        const currentLanguage = { en: "English", ms: "Bahasa Malaysia", zh: "Chinese" }[language] || "English";
        const approved = {};
        for (const { slug } of LIVING_SECTIONS) {
          const matching = records.filter((record) => record.slug === slug && record.review_status === "current");
          const record = matching.find((item) => item.language === currentLanguage)
            || matching.find((item) => item.language === "English");
          const text = typeof record?.body?.text === "string" ? record.body.text.trim() : "";
          if (text) approved[slug] = text;
        }
        setPublishedLivingCopy(approved);
      })
      .catch(() => { if (active) setPublishedLivingCopy({}); });
    return () => { active = false; };
  }, [language]);
  const [selectedOverview, setSelectedOverview] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const answeredCount = Object.keys(answers).length;
  const resetAssessment = () => {
    setAnswers({});
    setShowResult(false);
  };

  return (
    <main className="understand-page">
      <PublishedRecords
        kind="content_pages"
        slug="understand-dementia"
        title="Project updates"
      />
      <section className="understand-hero">
        <div className="understand-container understand-hero-grid">
          <div>
            <p className="understand-eyebrow">{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <p className="understand-lead">{t.lead}</p>
            <div className="understand-hero-actions">
              <a className="understand-button light" href="#early-signs">
                {t.exploreEarly} <span aria-hidden="true">↓</span>
              </a>
              <a className="understand-text-link" href="#healthy-living">
                Healthy &amp; Active Living ↓
              </a>
            </div>
          </div>
          <aside className="understand-key-card" aria-label={t.keyPoints}>
            <span className="understand-card-icon" aria-hidden="true">
              ✦
            </span>
            <h2>{t.keyPoints}</h2>
            <ul>
              {t.keyPointsList.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* Introduce what dementia means before RCBC's six-stage journey. */}
      <section className="understand-section" id="overview">
        <div className="understand-container">
          <div className="understand-section-heading">
            <p className="understand-eyebrow">{t.basics}</p>
            <h2>{t.whatIs}</h2>
            <p>{t.overviewIntro}</p>
          </div>
          <div className="understand-info-grid">
            {t.overviewCards.map((card, index) => (
              <button
                key={card.title}
                type="button"
                className={`understand-info-card${selectedOverview === index ? " featured" : ""}`}
                onClick={() => setSelectedOverview(index)}
                aria-pressed={selectedOverview === index}
                aria-controls="understand-overview-detail"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </button>
            ))}
          </div>
          <div
            className="understand-overview-detail"
            id="understand-overview-detail"
            role="region"
            aria-label="More about the selected topic"
          >
            <h3>{t.overviewCards[selectedOverview].title}</h3>
            <p>{t.overviewDetails[selectedOverview]}</p>
          </div>
          <div className="understand-common-types" id="common-types">
            <h3>{t.commonTypesTitle}</h3>
            <p>{t.commonTypesIntro}</p>
            <div className="understand-types-grid">
              {t.commonTypes.map((item) => (
                <article key={item.title}>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
          <p className="understand-note">
            <strong>{t.youngerOnset}</strong> {t.youngerText}
          </p>
          <a className="understand-step-next" href="#normal-ageing">
            Next: {reviewCopy.normalTitle} <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>


      {/* RCBC's requested reading order: normal ageing, changes, early signs,
          self-check, professional assessment, and further care. */}
      <section className="understand-section" id="normal-ageing">
        <div className="understand-container">
          <div className="understand-section-heading">
            <p className="understand-eyebrow">01 / {reviewCopy.normalTitle}</p>
            <h2>{reviewCopy.normalTitle}</h2>
            <p>{reviewCopy.normalIntro}</p>
          </div>
          <ul className="understand-brief-list">
            {t.comparison.slice(0, 2).map(([everyday]) => <li key={everyday}>{everyday}</li>)}
          </ul>
          <p className="understand-note">{reviewCopy.normalNote}</p>
          <a className="understand-step-next" href="#changes-to-watch">Next: {reviewCopy.changesTitle} <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className="understand-section understand-tinted" id="changes-to-watch">
        <div className="understand-container">
          <div className="understand-section-heading">
            <p className="understand-eyebrow">02 / {reviewCopy.changesTitle}</p>
            <h2>{reviewCopy.changesTitle}</h2>
            <p>{t.signsIntro}</p>
          </div>
          <div className="understand-comparison" role="table" aria-label={t.comparisonLabel}>
            <div className="understand-comparison-head" role="row">
              <div role="columnheader">{t.comparisonHead[0]}</div>
              <div role="columnheader">{t.comparisonHead[1]}</div>
            </div>
            {t.comparison.map(([left, right]) => (
              <div className="understand-comparison-row" role="row" key={left}>
                <p role="cell"><span className="comparison-mark calm" aria-hidden="true">○</span>{left}</p>
                <p role="cell"><span className="comparison-mark notice" aria-hidden="true">!</span>{right}</p>
              </div>
            ))}
          </div>
          <a className="understand-step-next" href="#early-signs">Next: {reviewCopy.earlyTitle} <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className="understand-section" id="early-signs">
        <div className="understand-container">
          <div className="understand-section-heading">
            <p className="understand-eyebrow">03 / {t.signsEyebrow}</p>
            <h2>{reviewCopy.earlyTitle}</h2>
            <p>{reviewCopy.earlyIntro}</p>
          </div>
          <ul className="understand-brief-list">
            {reviewCopy.earlyExamples.map((example) => <li key={example}>{example}</li>)}
          </ul>
          <p className="understand-note">{reviewCopy.earlyNote}</p>
          <a className="understand-step-next" href="#self-check">Next: {reviewCopy.selfCheckTitle} <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className="understand-section understand-tinted" id="self-check">
        <div className="understand-container">
          <div className="understand-section-heading">
            <p className="understand-eyebrow">04 / {t.selfAssessmentEyebrow}</p>
            <h2>{reviewCopy.selfCheckTitle}</h2>
            <p>{reviewCopy.selfCheckIntro}</p>
          </div>
          <div className="understand-assessment-card" id="why-changes-matter">
            <div className="understand-assessment-intro">
              <p className="understand-eyebrow">{t.selfAssessmentEyebrow}</p>
              <h3>{t.selfAssessmentTitle}</h3>
              <p>{t.selfAssessmentIntro}</p>
              <p className="understand-disclaimer understand-disclaimer-prominent" role="note">
                <strong>{reviewCopy.guideNotice}</strong> {reviewCopy.guideReminder}
              </p>
              <div
                className="understand-progress"
                aria-label={`${answeredCount} / ${t.questions.length} ${t.answered}`}
              >
                <span
                  style={{
                    width: `${(answeredCount / t.questions.length) * 100}%`,
                  }}
                />
              </div>
              <small>
                {answeredCount} / {t.questions.length} {t.answered}
              </small>
            </div>
            {!showResult ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setShowResult(true);
                }}
                className="understand-questionnaire"
              >
                {t.questions.map((question, index) => (
                  <fieldset key={index} className="understand-question">
                    <legend>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {question}
                    </legend>
                    <div className="understand-options">
                      {[
                        { value: "never", label: t.options[0] },
                        { value: "sometimes", label: t.options[1] },
                        { value: "often", label: t.options[2] },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={
                            answers[index] === option.value ? "selected" : ""
                          }
                        >
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={option.value}
                            checked={answers[index] === option.value}
                            onChange={() =>
                              setAnswers((current) => ({
                                ...current,
                                [index]: option.value,
                              }))
                            }
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <button
                  className="understand-button"
                  type="submit"
                  disabled={answeredCount !== t.questions.length}
                >
                  {t.viewGuidance}
                </button>
                <p className="understand-form-hint">{t.answerAll}</p>
              </form>
            ) : (
              <div className="understand-result" aria-live="polite">
                <h4>{t.resultTitle}</h4>
                <p className="understand-disclaimer understand-disclaimer-prominent" role="note">
                  <strong>{reviewCopy.guideNotice}</strong> {reviewCopy.guideReminder}
                </p>
                <p>{reviewCopy.generalGuidance}</p>
                <Link className="understand-button" to="/find-help/assessment-healthcare">
                  {t.healthcareLink} →
                </Link>
                <button
                  className="understand-reset"
                  type="button"
                  onClick={resetAssessment}
                >
                  {t.startAgain}
                </button>
              </div>
            )}
            <p className="understand-disclaimer" role="note">{t.disclaimer}</p>
          </div>
          <a className="understand-step-next" href="#medical-advice">Next: {reviewCopy.professionalTitle} <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className="understand-section understand-advice-section" id="medical-advice">
        <div className="understand-container">
          <div className="understand-section-heading">
            <p className="understand-eyebrow">05 / {reviewCopy.professionalTitle}</p>
            <h2>{reviewCopy.professionalTitle}</h2>
            <p>{reviewCopy.professionalIntro}</p>
          </div>
          <div className="understand-callout">
            <div>
              <h3>{t.findHelp}</h3>
              <p>{t.disclaimer}</p>
            </div>
            <Link to="/find-help/assessment-healthcare">{t.healthcareLink} →</Link>
          </div>
          <a className="understand-step-next" href="#further-care">Next: {reviewCopy.furtherTitle} <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className="understand-section understand-tinted" id="further-care">
        <div className="understand-container">
          <div className="understand-section-heading">
            <p className="understand-eyebrow">06 / {reviewCopy.furtherTitle}</p>
            <h2>{reviewCopy.furtherTitle}</h2>
            <p>{reviewCopy.furtherIntro}</p>
          </div>
          <div className="understand-next-steps">
            <Link to="/caregiver-support">{reviewCopy.caregiverLink} →</Link>
            <Link to="/find-help">{t.visitFindHelp} →</Link>
          </div>
        </div>
      </section>

      <section className="understand-section" id="healthy-living">
        <div className="understand-container">
          <div className="understand-section-heading">
            <p className="understand-eyebrow">{t.livingEyebrow}</p>
            <h2>Healthy &amp; Active Living</h2>
            <p>Explore four education topics and selected existing RCBC webinars. Webinar suggestions are provisional and await RCBC approval; they are not personal medical advice.</p>
          </div>
          <div className="understand-living-grid">
            {LIVING_SECTIONS.map((card, index) => (
              <article key={card.slug}>
                <span aria-hidden="true">{["♡", "↗", "◎", "✧"][index]}</span>
                <h3>{card.title}</h3>
                <p className="understand-living-description">{publishedLivingCopy[card.slug] || card.description}</p>
                <Link
                  className="understand-living-webinar"
                  to={`/learn-events/online-education?q=${encodeURIComponent(card.webinarQuery)}`}
                >
                  Suggested webinar (pending RCBC review): {card.webinarTitle} <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
          {/* Preserve existing deep links without creating a separate health-advice feed. */}
          <span id="risk-reduction" className="understand-anchor-target" aria-hidden="true" />
          <div className="understand-callout">
            <div>
              <h3>{t.learnTogether}</h3>
              <p>{t.learnTogetherText}</p>
            </div>
            <Link to="/learn-events/online-education">{reviewCopy.webinarLink} →</Link>
          </div>
          <p className="understand-note">{reviewCopy.healthNote}</p>
        </div>
      </section>

      <section
        className="understand-section understand-tinted"
        id="understand-faq"
      >
        <div className="understand-container understand-faq-layout">
          <div className="understand-section-heading">
            <p className="understand-eyebrow">{t.faqEyebrow}</p>
            <h2>{t.faqTitle}</h2>
            <p>{t.faqIntro}</p>
          </div>
          <div className="understand-faq-list">
            {t.faqs.map((faq) => (
              <details key={faq.q}>
                <summary>
                  {faq.q}
                  <span aria-hidden="true">＋</span>
                </summary>
                <p>
                  {faq.a}{" "}
                  {faq.link?.href && (
                    faq.link.href.startsWith("#") ? (
                      <a href={faq.link.href}>{faq.link.label} →</a>
                    ) : (
                      <Link to={faq.link.href}>{faq.link.label} →</Link>
                    )
                  )}
                </p>
              </details>
            ))}
            <p className="understand-faq-link">
              {t.concerned} <Link to="/find-help">{t.visitFindHelp} →</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default UnderstandDementia;
