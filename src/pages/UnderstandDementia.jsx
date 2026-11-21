import Trans from "../i18n/Trans";
import {understandingDementiaContent} from "../../shared/public-copy";
import PublishedRecords from "../components/PublishedRecords";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./UnderstandDementia.css";



// Each approved section can be edited by RCBC in Admin > Records > Content pages.
// Use these slugs and publish only reviewed material. Otherwise show neutral copy.


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
  const reviewCopy = t.reviewCopy;
  const LIVING_SECTIONS = t.livingSections;
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
        title={translationsData.inlineCopy.projectUpdates}
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
              <a className="understand-text-link" href="#healthy-living"><Trans id="healthyActive">
                Healthy &amp; Active Living ↓
              </Trans></a>
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
            {t.next} {reviewCopy.normalTitle} <span aria-hidden="true">→</span>
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
          <a className="understand-step-next" href="#changes-to-watch">{t.next} {reviewCopy.changesTitle} <span aria-hidden="true">→</span></a>
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
          <a className="understand-step-next" href="#early-signs">{t.next} {reviewCopy.earlyTitle} <span aria-hidden="true">→</span></a>
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
          <a className="understand-step-next" href="#self-check">{t.next} {reviewCopy.selfCheckTitle} <span aria-hidden="true">→</span></a>
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
          <a className="understand-step-next" href="#medical-advice">{t.next} {reviewCopy.professionalTitle} <span aria-hidden="true">→</span></a>
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
          <a className="understand-step-next" href="#further-care">{t.next} {reviewCopy.furtherTitle} <span aria-hidden="true">→</span></a>
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
            <h2>{t.healthyTitle}</h2>
            <p>{t.healthyIntro}</p>
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
                  {t.suggestedWebinar} {card.webinarTitle} <span aria-hidden="true">→</span>
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
