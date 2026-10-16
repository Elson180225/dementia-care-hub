import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./UnderstandDementia.css";

function UnderstandDementia() {
  const t = useModuleTranslations("understandingDementia");
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
    <main className="understand-page"}>
      <section className="understand-hero">
        <div className="understand-container understand-hero-grid">
          <div>
            <p className="understand-eyebrow">{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <p className="understand-lead">{t.lead}</p>
            <div className="understand-hero-actions">
              <a className="understand-button light" href="#early-signs">{t.exploreEarly} <span aria-hidden="true">↓</span></a>
              <a className="understand-text-link" href="#healthy-living">{t.healthyActive}</a>
            </div>
          </div>
          <aside className="understand-key-card" aria-label={t.keyPoints}>
            <span className="understand-card-icon" aria-hidden="true">✦</span>
            <h2>{t.keyPoints}</h2>
            <ul>{t.keyPointsList.map((point) => <li key={point}>{point}</li>)}</ul>
          </aside>
        </div>
      </section>

      <nav className="understand-contents" aria-label={t.onPage}>
        <div className="understand-container understand-contents-inner">
          <span>{t.onPage}</span>
          <a href="#overview">{t.overview}</a><a href="#early-signs">{t.earlySigns}</a><a href="#healthy-living">{t.healthyActive}</a><a href="#understand-faq">{t.faq}</a>
        </div>
      </nav>

      <section className="understand-section" id="overview">
        <div className="understand-container">
          <div className="understand-section-heading"><p className="understand-eyebrow">{t.basics}</p><h2>{t.whatIs}</h2><p>{t.overviewIntro}</p></div>
          <div className="understand-info-grid">
            {t.overviewCards.map((card, index) => <article className={`understand-info-card${index === 0 ? " featured" : ""}`} key={card.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{card.title}</h3><p>{card.text}</p></article>)}
          </div>
          <p className="understand-note"><strong>{t.youngerOnset}</strong> {t.youngerText}</p>
        </div>
      </section>

      <section className="understand-section understand-tinted" id="early-signs">
        <div className="understand-container">
          <div className="understand-section-heading"><p className="understand-eyebrow">{t.signsEyebrow}</p><h2>{t.signsTitle}</h2><p>{t.signsIntro}</p></div>
          <div className="understand-comparison" role="table" aria-label={t.comparisonLabel}>
            <div className="understand-comparison-head" role="row"><div role="columnheader">{t.comparisonHead[0]}</div><div role="columnheader">{t.comparisonHead[1]}</div></div>
            {t.comparison.map(([left, right]) => <div className="understand-comparison-row" role="row" key={left}><p role="cell"><span className="comparison-mark calm" aria-hidden="true">○</span>{left}</p><p role="cell"><span className="comparison-mark notice" aria-hidden="true">!</span>{right}</p></div>)}
          </div>
          <div className="understand-assessment-card">
            <div className="understand-assessment-intro"><p className="understand-eyebrow">{t.selfAssessmentEyebrow}</p><h3>{t.selfAssessmentTitle}</h3><p>{t.selfAssessmentIntro}</p><div className="understand-progress" aria-label={`${answeredCount} / ${t.questions.length} ${t.answered}`}><span style={{ width: `${(answeredCount / t.questions.length) * 100}%` }} /></div><small>{answeredCount} / {t.questions.length} {t.answered}</small></div>
            {!showResult ? <form onSubmit={(event) => { event.preventDefault(); setShowResult(true); }} className="understand-questionnaire">
              {t.questions.map((question, index) => <fieldset key={index} className="understand-question"><legend><span>{String(index + 1).padStart(2, "0")}</span>{question}</legend><div className="understand-options">{[{ value: "never", label: t.options[0] }, { value: "sometimes", label: t.options[1] }, { value: "often", label: t.options[2] }].map((option) => <label key={option.value} className={answers[index] === option.value ? "selected" : ""}><input type="radio" name={`question-${index}`} value={option.value} checked={answers[index] === option.value} onChange={() => setAnswers((current) => ({ ...current, [index]: option.value }))} />{option.label}</label>)}</div></fieldset>)}
              <button className="understand-button" type="submit" disabled={answeredCount !== t.questions.length}>{t.viewGuidance}</button><p className="understand-form-hint">{t.answerAll}</p>
            </form> : <div className="understand-result" aria-live="polite"><h4>{t.resultTitle}</h4>{result === "consider" ? <><p><strong>{t.considerTitle}</strong> {t.considerText}</p><Link className="understand-button" to="/find-help/assessment-healthcare">{t.findHelp} →</Link></> : result === "observe" ? <><p><strong>{t.observeTitle}</strong> {t.observeText}</p><Link className="understand-button" to="/find-help/assessment-healthcare">{t.healthcareLink} →</Link></> : <><p><strong>{t.wellbeingTitle}</strong> {t.wellbeingText}</p><a className="understand-button" href="#healthy-living">{t.healthyActive} →</a></>}<button className="understand-reset" type="button" onClick={resetAssessment}>{t.startAgain}</button></div>}
            <p className="understand-disclaimer">{t.disclaimer}</p>
          </div>
        </div>
      </section>

      <section className="understand-section" id="healthy-living">
        <div className="understand-container">
          <div className="understand-section-heading"><p className="understand-eyebrow">{t.livingEyebrow}</p><h2>{t.livingTitle}</h2><p>{t.livingIntro}</p></div>
          <div className="understand-living-grid">{t.livingCards.map((card, index) => <article key={card.title}><span aria-hidden="true">{["♡", "↗", "◎", "✧"][index]}</span><h3>{card.title}</h3><ul>{card.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
          <div className="understand-callout"><div><h3>{t.learnTogether}</h3><p>{t.learnTogetherText}</p></div><Link to="/learn-events">{t.learnEvents} →</Link></div>
          <p className="understand-note">{t.riskNote}</p>
        </div>
      </section>

      <section className="understand-section understand-tinted" id="understand-faq">
        <div className="understand-container understand-faq-layout"><div className="understand-section-heading"><p className="understand-eyebrow">{t.faqEyebrow}</p><h2>{t.faqTitle}</h2><p>{t.faqIntro}</p></div><div className="understand-faq-list">{t.faqs.map((faq) => <details key={faq.q}><summary>{faq.q}<span aria-hidden="true">＋</span></summary><p>{faq.a}</p></details>)}<p className="understand-faq-link">{t.concerned} <Link to="/find-help">{t.visitFindHelp} →</Link></p></div></div>
      </section>
    </main>
  );
}

export default UnderstandDementia;
