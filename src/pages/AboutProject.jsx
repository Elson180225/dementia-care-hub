import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import {
  overview,
  mission,
  journey,
  organiser,
  strategicPartner,
  advisors,
  supportedBy,
  acknowledgements,
} from "../data/about";
import "./AboutProject.css";

function Section({ id, title, children, records = [] }) {
  return (
    <section id={id} className="about-section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {records.length ? records.map(record => <article key={record.id} className="about-approved"><h3>{record.title}</h3><p style={{ whiteSpace: "pre-line" }}>{record.body?.text}</p></article>) : children}
    </section>
  );
}

function ContributionList({ items }) {
  return (
    <ul className="about-list">
      {items.map((item) => (
        <li key={item.name}>
          <strong>{item.name}</strong> – {item.contribution || item.support}
          {(item.programme || item.phase) && (
            <span> | {item.programme || item.phase}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function AboutProject() {
  const { t,translateContent } = useLanguage();
  const [rawRecords, setRecords] = useState([]);
  const records=translateContent(rawRecords.filter(r=>r.language==='English'),'records/content_pages');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/public/content_pages', { signal: controller.signal }).then(r => r.ok ? r.json() : []).then(data => setRecords(Array.isArray(data) ? data : [])).catch(() => {});
    return () => controller.abort();
  }, []);
  const languageName = 'English';
  const approved = id => records.filter(r => r.slug === `about-${id}` && r.language === languageName);
  const hasThanks = acknowledgements.some(group => group.items.length) || approved('acknowledgements').length > 0;
  const navigation = [{id:'overview',label:t.aboutProject.projectOverview},{id:'journey',label:t.aboutProject.ourJourney},{id:'organiser',label:t.aboutProject.peoplePartners},...(hasThanks ? [{id:'acknowledgements',label:t.aboutProject.acknowledgements}] : [])];
  const ap = t.aboutProject;

  return (
    <main className="about-page">
      <header className="about-hero">
        <div className="about-container">
          <p className="about-kicker">{ap.kicker}</p>
          <h1>{ap.project || overview.project}</h1>
          <p className="about-theme">“{ap.theme || overview.theme}”</p>
        </div>
      </header>

      <div className="about-container about-layout">
        <nav className="about-toc" aria-label="On this page">
          <p className="about-toc-title">{ap.onPage}</p>
          <ol>
            {navigation.map(item => <li key={item.id}><a href={`#${item.id}`}>{item.label}</a></li>)}
          </ol>
        </nav>

        <div className="about-content">
          <Section records={approved("overview")} id="overview" title={ap.projectOverview || "Project Overview"}>
            <p>{ap.overviewIntro || overview.intro}</p>
            <p>{ap.overviewPlatform || overview.platformText}</p>
            <div className="about-two-col">
              <div className="about-card about-card-is">
                <h3>{ap.dccIs || "Dementia Care Connect is"}</h3>
                <ul>
                  {(ap.isItems || overview.is).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="about-card about-card-isnot">
                <h3>{ap.dccIsNot || "Dementia Care Connect is not"}</h3>
                <ul>
                  {(ap.isNotItems || overview.isNot).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section records={approved("mission")} id="mission" title={ap.ourMission || "Our Mission & Vision"}>
            <div className="about-two-col">
              <div className="about-card">
                <h3>{ap.mission || "Mission"}</h3>
                <p>{ap.missionText || mission.mission}</p>
              </div>
              <div className="about-card">
                <h3>{ap.vision || "Vision"}</h3>
                <p>{ap.visionText || mission.vision}</p>
              </div>
            </div>
          </Section>

          <Section records={approved("journey")} id="journey" title={ap.ourJourney || "Our Journey"}>
            <ol className="about-journey">
              {(ap.journeySteps || journey).map((step) => (
                <li
                  key={step.phase}
                  className={step.current ? "is-current" : ""}
                  aria-current={step.current ? "step" : undefined}
                >
                  <span className="about-phase">{step.phase}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  {step.current && (
                    <span className="about-badge">{ap.currentPhase || "You are here"}</span>
                  )}
                </li>
              ))}
            </ol>
          </Section>

          <div className="about-partners"><h2>{ap.peoplePartners}</h2>
          <Section records={approved("organiser")} id="organiser" title={ap.organiser || "Organiser"}>
            <h3>{organiser.name}</h3>
            <p>{ap.organiserText || organiser.text}</p>
            {organiser.link && (
              <p>
                <a href={organiser.link} target="_blank" rel="noopener noreferrer">
                  {ap.visitRotarySite || "Visit the Rotary Club website"}
                </a>
              </p>
            )}
          </Section>

          <Section records={approved("partner")} id="partner" title={ap.strategicPartner || "Strategic Partner"}>
            <h3>{strategicPartner.name}</h3>
            <p>{ap.partnerText || strategicPartner.text}</p>
          </Section>

          <Section records={approved("advisors")} id="advisors" title={ap.projectAdvisors || "Project Advisors"}>
            <p>{ap.advisorsRole || advisors.role}</p>
            <ul className="about-people">
              {advisors.people.map((name) => (
                <li key={name}>
                  <strong>{name}</strong>
                  <span>{ap.advisorLabel || "Project Advisor"}</span>
                </li>
              ))}
            </ul>
          </Section>

          </div>
          {(supportedBy.items.length > 0 || approved("supported").length > 0) && <Section records={approved("supported")} id="supported" title={ap.supportedBy || "Supported By"}>
            <p>{ap.supportedText || supportedBy.text}</p>
            {supportedBy.items.length > 0 ? (
              <ContributionList items={supportedBy.items} />
            ) : (
              <p className="about-pending">
                {ap.supportedPending || "Supporting organisations will be listed here once confirmed by RCBC."}
              </p>
            )}
          </Section>}

          {hasThanks && <Section records={approved("acknowledgements")} id="acknowledgements" title={ap.acknowledgements || "Acknowledgements"}>
            <p>
              {ap.ackIntro || "We thank everyone who has contributed to the project. Each acknowledgement shows who contributed, how, and in which phase or programme."}
            </p>
            {acknowledgements.filter(group => group.items.length).map((group) => (
              <div key={group.title} className="about-ack">
                <h3>{group.title}</h3>
                <p>{group.text}</p>
                {group.items.length > 0 ? (
                  <ContributionList items={group.items} />
                ) : (
                  <p className="about-pending">
                    {ap.ackPending || "To be confirmed by RCBC."}
                  </p>
                )}
              </div>
            ))}
          </Section>}
          {records.filter(r => r.slug === 'about' && r.language === languageName).map(r => <article className="about-section" key={r.id}><h2>{r.title}</h2><p style={{whiteSpace:'pre-line'}}>{r.body?.text}</p></article>)}
          <nav className="about-next" aria-label={ap.nextSteps}><h2>{ap.nextSteps}</h2><Link to="/find-help">{ap.findSupport}</Link><Link to="/learn-events/events">{ap.exploreEvents}</Link><Link to="/contact">{ap.contactUs}</Link></nav>
        </div>
      </div>
    </main>
  );
}
