import PublishedRecords from "../components/PublishedRecords";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  onPage: "On this page",
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

function UnderstandDementia() {
  const t = understandingDementiaContent;
  const [selectedOverview, setSelectedOverview] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const answeredCount = Object.keys(answers).length;
  const result = useMemo(() => {
    const values = Object.values(answers);
    if (values.includes("often")) return "consider";
    if (values.includes("sometimes")) return "observe";
    return "wellbeing";
  }, [answers]);

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
                {t.healthyActive}
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

      <nav className="understand-contents" aria-label={t.onPage}>
        <div className="understand-container understand-contents-inner">
          <span>{t.onPage}</span>
          <a href="#overview">{t.overview}</a>
          <a href="#early-signs">{t.earlySigns}</a>
          <a href="#healthy-living">{t.healthyActive}</a>
          <a href="#understand-faq">{t.faq}</a>
        </div>
      </nav>

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
        </div>
      </section>

      <section
        className="understand-section understand-tinted"
        id="early-signs"
      >
        <div className="understand-container">
          <div className="understand-section-heading">
            <p className="understand-eyebrow">{t.signsEyebrow}</p>
            <h2>{t.signsTitle}</h2>
            <p>{t.signsIntro}</p>
          </div>
          <div
            className="understand-comparison"
            role="table"
            aria-label={t.comparisonLabel}
          >
            <div className="understand-comparison-head" role="row">
              <div role="columnheader">{t.comparisonHead[0]}</div>
              <div role="columnheader">{t.comparisonHead[1]}</div>
            </div>
            {t.comparison.map(([left, right]) => (
              <div className="understand-comparison-row" role="row" key={left}>
                <p role="cell">
                  <span className="comparison-mark calm" aria-hidden="true">
                    ○
                  </span>
                  {left}
                </p>
                <p role="cell">
                  <span className="comparison-mark notice" aria-hidden="true">
                    !
                  </span>
                  {right}
                </p>
              </div>
            ))}
          </div>
          <div className="understand-assessment-card">
            <div className="understand-assessment-intro">
              <p className="understand-eyebrow">{t.selfAssessmentEyebrow}</p>
              <h3>{t.selfAssessmentTitle}</h3>
              <p>{t.selfAssessmentIntro}</p>
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
                {result === "consider" ? (
                  <>
                    <p>
                      <strong>{t.considerTitle}</strong> {t.considerText}
                    </p>
                    <Link
                      className="understand-button"
                      to="/find-help/assessment-healthcare"
                    >
                      {t.findHelp} →
                    </Link>
                  </>
                ) : result === "observe" ? (
                  <>
                    <p>
                      <strong>{t.observeTitle}</strong> {t.observeText}
                    </p>
                    <Link
                      className="understand-button"
                      to="/find-help/assessment-healthcare"
                    >
                      {t.healthcareLink} →
                    </Link>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>{t.wellbeingTitle}</strong> {t.wellbeingText}
                    </p>
                    <a className="understand-button" href="#healthy-living">
                      {t.healthyActive} →
                    </a>
                  </>
                )}
                <button
                  className="understand-reset"
                  type="button"
                  onClick={resetAssessment}
                >
                  {t.startAgain}
                </button>
              </div>
            )}
            <p className="understand-disclaimer">{t.disclaimer}</p>
          </div>
        </div>
      </section>

      <section className="understand-section" id="healthy-living">
        <div className="understand-container">
          <div className="understand-section-heading">
            <p className="understand-eyebrow">{t.livingEyebrow}</p>
            <h2>{t.livingTitle}</h2>
            <p>{t.livingIntro}</p>
          </div>
          <div className="understand-living-grid">
            {t.livingCards.map((card, index) => (
              <article key={card.title}>
                <span aria-hidden="true">{["♡", "↗", "◎", "✧"][index]}</span>
                <h3>{card.title}</h3>
                <ul>
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="understand-risk" id="risk-reduction">
            <h3>{t.riskTitle}</h3>
            <p>{t.riskDescription}</p>
          </div>
          <div className="understand-callout">
            <div>
              <h3>{t.learnTogether}</h3>
              <p>{t.learnTogetherText}</p>
            </div>
            <Link to="/learn-events">{t.learnEvents} →</Link>
          </div>
          <p className="understand-note">{t.riskNote}</p>
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
                  {faq.link.href.startsWith("#") ? (
                    <a href={faq.link.href}>{faq.link.label} →</a>
                  ) : (
                    <Link to={faq.link.href}>{faq.link.label} →</Link>
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
