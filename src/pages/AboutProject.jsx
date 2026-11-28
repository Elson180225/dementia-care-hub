import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import HeroPhoto, { HeroWithPhoto } from "../components/HeroPhoto/HeroPhoto";
import heroPhoto from "../assets/Group_Photo.png";

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
  const { t,translateContent, translateLabel } = useLanguage();
  const [rawRecords, setRecords] = useState([]);
  const pageRef = useRef(null);
  const [activeSection, setActiveSection] = useState("overview");

  // The global header changes height across languages, zoom levels and layouts.
  // Keep both sticky navigation and anchor destinations below its full height.
  useLayoutEffect(() => {
    const page = pageRef.current;
    const header = document.querySelector(".site-header");
    if (!page || !header) return;
    let frame = 0;
    let offset = 0;
    const sections = [
      ["overview", "overview"], ["mission", "mission"], ["objectives", "mission"],
      ["journey", "journey"], ["organiser", "organiser"], ["partner", "organiser"],
      ["advisors", "organiser"], ["supported", "supported"], ["acknowledgements", "acknowledgements"],
    ];
    const updateActive = () => {
      frame = 0;
      let current = "overview";
      for (const [id, navId] of sections) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= offset + 12) current = navId;
      }
      setActiveSection(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(updateActive); };
    const measure = () => {
      offset = Math.ceil(header.getBoundingClientRect().height) + 16;
      page.style.setProperty("--about-header-offset", `${offset}px`);
      schedule();
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(header);
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", schedule);
      if (frame) cancelAnimationFrame(frame);
      page.style.removeProperty("--about-header-offset");
    };
  }, []);
  const records=translateContent(rawRecords.filter(r=>r.language==='English'),'records/content_pages');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/public/content_pages', { signal: controller.signal }).then(r => r.ok ? r.json() : []).then(data => setRecords(Array.isArray(data) ? data : [])).catch(() => {});
    return () => controller.abort();
  }, []);
  const languageName = 'English';
  const approved = id => records.filter(r => r.slug === `about-${id}` && r.language === languageName);

  const navigation = [{id:"overview",label:t.aboutProject.projectOverview},{id:"mission",label:t.caregiverDraft.missionObjectives},{id:"journey",label:t.aboutProject.ourJourney},{id:"organiser",label:t.aboutProject.peoplePartners},{id:"supported",label:t.aboutProject.supportedBy},{id:"acknowledgements",label:t.aboutProject.acknowledgements}];
  const ap = t.aboutProject;

  return (
    <main className="about-page" ref={pageRef}>
      <header className="about-hero">
        <div className="about-container"><HeroWithPhoto photo={<HeroPhoto src={heroPhoto} alt="The RCBC Alzheimer’s Care Project team at a training event" />}>
          <p className="about-kicker">{ap.kicker}</p>
          <h1>{ap.project || overview.project}</h1>
          <p className="about-theme">“{ap.theme || overview.theme}”</p>
        </HeroWithPhoto></div>
      </header>

      <div className="about-container about-layout">
        <nav className="about-toc" aria-label={translateLabel("On this page", "onThisPage")}>
          <p className="about-toc-title">{ap.onPage}</p>
          <ol>
            {navigation.map(item => <li key={item.id}><a href={`#${item.id}`} aria-current={activeSection === item.id ? "location" : undefined}>{item.label}</a></li>)}
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

          <Section records={approved("mission")} id="mission" title={t.caregiverDraft.missionObjectives}>
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

          <Section records={approved("objectives")} id="objectives" title={t.caregiverDraft.objectivesTitle}><ol className="about-objectives">{t.caregiverDraft.objectives.map((item,index) => <li key={item}><span aria-hidden="true">0{index+1}</span><p>{item}</p></li>)}</ol><p className="about-pending">{t.caregiverDraft.workingWording}</p></Section>
          <Section id="journey" title={ap.ourJourney || "Our Journey"}>
            <ol className="about-journey">
              {(ap.journeySteps || journey).map((step, index) => (
                <li
                  key={step.phase}
                  className={step.current ? "is-current" : ""}
                  aria-current={step.current ? "step" : undefined}
                >
                  <span className="about-phase">{step.phase}</span>
                  <h3>{t.caregiverDraft.phaseTitles[index] || step.title}</h3>
                  {index < 2 && <>{approved(`phase-${index+1}`).length ? approved(`phase-${index+1}`).map(r=><p key={r.id} style={{whiteSpace:"pre-line"}}>{r.body?.text}</p>) : <p>{step.text}</p>}</>}
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
          <Section records={approved("supported")} id="supported" title={ap.supportedBy || "Supported By"}>
            <p>{ap.supportedText || supportedBy.text}</p>
            {supportedBy.items.length > 0 ? (
              <ContributionList items={supportedBy.items} />
            ) : (
              <p className="about-pending">
                {ap.supportedPending || "Supporting organisations will be listed here once confirmed by RCBC."}
              </p>
            )}
          </Section>

          <Section records={approved("acknowledgements")} id="acknowledgements" title={ap.acknowledgements || "Acknowledgements"}>
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
            {!acknowledgements.some(group => group.items.length) && <p className="about-pending">{t.caregiverDraft.contributorsPending}</p>}
          </Section>
          {/* Legacy generic About and journey records need RCBC re-review before publication under Draft 02. */}
          <nav className="about-next" aria-label={ap.nextSteps}><h2>{ap.nextSteps}</h2><Link to="/find-help">{ap.findSupport}</Link><Link to="/learn-events/events">{ap.exploreEvents}</Link><Link to="/contact">{ap.contactUs}</Link></nav>
        </div>
      </div>
    </main>
  );
}
