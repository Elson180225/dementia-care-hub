import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import educationImage from "../assets/understand-dementia.jpg";
import trainingImage from "../assets/Group_Photo_2.png";
import webinarImage from "../assets/learning-events.jpg";
import eventImage from "../assets/Get-involved-hero.png";
import "./LearnEvents.css";

const pageInfo = {
  education: { eyebrow: "Dementia Education", title: "Understand dementia, one step at a time.", intro: "Short, reliable information for individuals, families, and caregivers.", image: educationImage, imageAlt: "Older adult receiving support from a family member" },
  training: { eyebrow: "Training Resources", title: "Practical tools for confident trainers.", intro: "A simple home for trainer pathways, session materials, and helpful delivery guidance.", image: trainingImage, imageAlt: "Community group learning together" },
  webinars: { eyebrow: "Webinars", title: "Learn wherever you are.", intro: "Join upcoming online sessions or revisit selected learning topics.", image: webinarImage, imageAlt: "People taking part in a learning event" },
  events: { eyebrow: "Certified Trainer-led Events", title: "Find a learning session near you.", intro: "Search public workshops and trainer-led sessions by city and delivery language.", image: eventImage, imageAlt: "Community members supporting a care initiative" },
};

const events = [
  { id: 1, title: "Dementia Awareness Workshop", date: "15 Oct 2026", time: "9:00 AM – 12:00 PM", city: "Bintulu", language: "English", type: "Workshop", description: "A gentle introduction to dementia, communication, and local support." },
  { id: 2, title: "Supporting Families & Caregivers", date: "28 Oct 2026", time: "2:00 PM – 5:00 PM", city: "Kuching", language: "Bahasa Melayu", type: "Training", description: "Practical ideas for everyday caregiving and caregiver wellbeing." },
  { id: 3, title: "Understanding Memory Changes", date: "7 Nov 2026", time: "10:00 AM – 11:30 AM", city: "Miri", language: "English", type: "Public talk", description: "Learn when memory and thinking changes should be discussed with a clinician." },
];

const webinars = [
  ["Understanding dementia", "A clear introduction to symptoms, types, diagnosis, and support."],
  ["Communication that supports dignity", "Simple ways to make conversations calmer and more connected."],
  ["Caregiver wellbeing", "Recognising stress and building a support network."],
  ["Healthy ageing", "Everyday actions that support brain and overall health."],
  ["Responding to behaviour changes", "Look for possible causes and respond with patience and safety."],
  ["Living well with dementia", "Person-centred routines, meaningful activities, and community."],
  ["Planning for the future", "Questions to discuss with family and healthcare professionals."],
  ["Trainer community exchange", "Share learning ideas and delivery experiences with trainers."],
  ["Ask a dementia educator", "A future question-and-answer session for families and trainers."],
].map(([title, description], id) => ({ id, title, description, date: "Upcoming", language: id % 2 ? "Bahasa Melayu / English" : "English" }));

function VideoLink() {
  return <a className="video-link" href="https://www.youtube.com/watch?v=EVJS0pypfYw" target="_blank" rel="noreferrer"><span aria-hidden="true">▶</span> Watch a caregiver video <small>opens in a new tab</small></a>;
}

function EducationModule() {
  const learningSteps = [
    ["01", "Notice", "Changes may affect memory, language, judgement, mood, or familiar tasks.", "Look for patterns that affect everyday life, rather than one occasional lapse."],
    ["02", "Discuss", "Keep notes and speak with a healthcare professional.", "Several conditions can cause similar symptoms, so an assessment is important."],
    ["03", "Support", "Use clear communication, familiar routines, and meaningful activities.", "Support should include the person living with dementia and the people caring for them."],
  ];

  return <main className="education-module">
    <section className="education-section education-overview"><div className="section-container"><div className="education-intro"><div><span className="section-label">A useful starting point</span><h2>Dementia is an umbrella term. Alzheimer’s is one cause.</h2><p>Dementia describes a decline in memory, thinking, behaviour, or the ability to manage everyday activities. It is caused by different diseases and injuries that affect the brain.</p><p>Alzheimer’s disease is the most common cause, but it is not the only one.</p></div><div className="umbrella-visual" aria-hidden="true"><span>Dementia</span><i>Alzheimer’s</i><i>Vascular</i><i>Frontotemporal</i><i>Lewy body</i></div></div></div></section>
    <section className="education-section comparison-section"><div className="section-container"><div className="section-heading"><span className="section-label">Understand the terms</span><h2>Dementia and Alzheimer’s: what is the difference?</h2><p>These terms are related, but they do not mean the same thing.</p></div><div className="comparison-grid"><div className="comparison-head">Dementia</div><div className="comparison-head">Alzheimer’s disease</div><div><strong>A broad term</strong><p>Describes a set of symptoms that interfere with daily life.</p></div><div><strong>A specific disease</strong><p>A brain disease that can cause dementia through changes such as amyloid plaques and tau tangles.</p></div><div><strong>Many possible causes</strong><p>Examples include Alzheimer’s, vascular disease, Lewy body disease, and frontotemporal disorders. Mixed causes can occur.</p></div><div><strong>Often begins with memory changes</strong><p>Memory is commonly affected early, although symptoms vary from person to person.</p></div></div></div></section>
    <section className="education-section learning-section"><div className="section-container"><div className="section-heading"><span className="section-label">A simple learning path</span><h2>What can you do when you notice changes?</h2><p>Hover over a card or focus it with the keyboard to reveal the next step.</p></div><div className="path-line">{learningSteps.map(([number, title, front, back]) => <article className="flip-card" tabIndex="0" key={title}><div className="flip-card-inner"><div className="flip-card-face flip-card-front"><b>{number}</b><h3>{title}</h3><p>{front}</p><span className="flip-hint">Hover or focus to learn more ↗</span></div><div className="flip-card-face flip-card-back"><b>{number}</b><h3>{title}</h3><p>{back}</p></div></div></article>)}</div></div></section>
    <section className="education-section support-section"><div className="section-container"><div className="education-callout"><div><h2>Concerned about changes?</h2><p>Information online cannot diagnose dementia. A clinician can assess possible causes and advise on next steps.</p></div><VideoLink /></div><p className="source-note">Content reviewed against guidance from the <a href="https://www.who.int/news-room/fact-sheets/detail/dementia" target="_blank" rel="noreferrer">World Health Organization</a> and the <a href="https://www.nia.nih.gov/health/alzheimers-and-dementia/what-dementia-symptoms-types-and-diagnosis" target="_blank" rel="noreferrer">National Institute on Aging</a>.</p></div></section>
  </main>;
}

function EventFinder() {
  const [city, setCity] = useState("All cities"); const [language, setLanguage] = useState("All languages"); const [query, setQuery] = useState("");
  const displayedEvents = useMemo(() => events.filter((event) => { const searchable = `${event.title} ${event.type} ${event.description}`.toLowerCase(); return (city === "All cities" || event.city === city) && (language === "All languages" || event.language === language) && searchable.includes(query.toLowerCase()); }), [city, language, query]);
  return <section className="module-content"><div className="section-container"><div className="filter-bar"><label><span className="sr-only">Search events</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events" /></label><label><span className="sr-only">Filter by city</span><select value={city} onChange={(event) => setCity(event.target.value)}><option>All cities</option><option>Bintulu</option><option>Kuching</option><option>Miri</option></select></label><label><span className="sr-only">Filter by language</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option>All languages</option><option>English</option><option>Bahasa Melayu</option></select></label></div><p className="results-count">{displayedEvents.length} event{displayedEvents.length === 1 ? "" : "s"} found</p><div className="event-list">{displayedEvents.map((event) => <article className="event-card" key={event.id}><div className="event-poster" aria-hidden="true">Event<br />poster</div><div><span className="tag">{event.type}</span><h2>{event.title}</h2><p>{event.description}</p><div className="event-meta"><span>{event.date}</span><span>{event.time}</span><span>{event.city} · {event.language}</span></div><button className="registration-button" type="button" disabled>Google Form link to be added</button></div></article>)}</div></div></section>;
}

function TrainingModule() {
  const [openFaq, setOpenFaq] = useState(null);
  const steps = [
    ["01", "Learn", "Build a clear foundation in dementia education."],
    ["02", "Prepare", "Choose your audience, topic, and session format."],
    ["03", "Deliver", "Create a respectful, inclusive learning space."],
    ["04", "Reflect", "Collect feedback and improve the next session."],
    ["05", "Connect", "Share events and help people find further support."],
  ];
  const toolkit = [
    ["▣", "Session slides", "A clear starting point for presentations."],
    ["▤", "Participant handouts", "Simple materials to take home."],
    ["✓", "Session checklist", "Prepare the room, materials, and timing."],
    ["?", "Question guide", "Prompts for safe and useful discussion."],
  ];
  const faqs = [
    ["Can trainers adapt the materials?", "Use approved materials as the foundation, then check any adaptations with the training team."],
    ["How should medical questions be handled?", "Keep general sessions educational. Encourage personal health questions to be discussed with a qualified healthcare professional."],
    ["How can I share a new event?", "Use the event submission process provided by the project team so the city, language, date, and registration details are complete."],
  ];

  return <section className="training-module"><section className="training-block training-path-section"><div className="section-container"><div className="training-heading"><span className="section-label">Your trainer journey</span><h2>From learning to sharing.</h2><p>A simple pathway for preparing thoughtful community education.</p></div><div className="trainer-steps">{steps.map(([number, title, text]) => <article key={title}><b>{number}</b><h3>{title}</h3><p>{text}</p></article>)}</div></div></section><section className="training-block toolkit-section"><div className="section-container"><div className="training-heading"><span className="section-label">Trainer toolkit</span><h2>Useful resources, in one place.</h2></div><div className="toolkit-grid">{toolkit.map(([icon, title, text]) => <article key={title}><span className="toolkit-icon" aria-hidden="true">{icon}</span><div><h3>{title}</h3><p>{text}</p><button type="button" disabled>Available soon</button></div></article>)}</div></div></section><section className="training-block session-section"><div className="section-container session-layout"><div><span className="section-label">Before your session</span><h2>Four things to check.</h2></div><ol className="session-checklist"><li>Know your audience and their learning needs.</li><li>Use clear language, readable visuals, and captions where needed.</li><li>Plan time for questions, breaks, and reflection.</li><li>End with trusted resources and a clear next step.</li></ol></div></section><section className="training-block faq-section"><div className="section-container"><div className="training-heading"><span className="section-label">Quick answers</span><h2>Trainer questions.</h2></div><div className="training-faqs">{faqs.map(([question, answer], index) => <div key={question} className={`training-faq ${openFaq === index ? "is-open" : ""}`}><button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{question}</span><span aria-hidden="true">{openFaq === index ? "−" : "+"}</span></button>{openFaq === index && <p>{answer}</p>}</div>)}</div></div></section><section className="training-cta"><div className="section-container"><h2>Ready to keep learning?</h2><p>Explore upcoming trainer-led sessions and community events.</p><Link className="primary-button" to="/learn-events/events">View trainer events</Link></div></section></section>;
}

function WebinarModule() {
  const [selected, setSelected] = useState(null); const dialogRef = useRef(null);
  useEffect(() => { if (!selected) return undefined; dialogRef.current?.focus(); const close = (event) => event.key === "Escape" && setSelected(null); document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [selected]);
  return <section className="module-content"><div className="section-container"><div className="webinar-heading"><div><span className="section-label">Upcoming and on demand</span><h2>Learn in short, friendly sessions.</h2></div><p>Click any card to see the planned topic and audience.</p></div><div className="webinar-grid">{webinars.map((webinar) => <button className="webinar-card" type="button" key={webinar.id} onClick={() => setSelected(webinar)}><div className="webinar-thumb"><img src={webinarImage} alt="" /><span className="play-mark" aria-hidden="true">▶</span></div><div className="webinar-card-body"><span className="tag">{webinar.date}</span><h3>{webinar.title}</h3><p>{webinar.description}</p><small>{webinar.language} · Details</small></div></button>)}</div>{selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><div className="webinar-modal" role="dialog" aria-modal="true" aria-labelledby="webinar-title" tabIndex="-1" ref={dialogRef}><button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close webinar details">×</button><span className="tag">{selected.date}</span><h2 id="webinar-title">{selected.title}</h2><p>{selected.description}</p><dl><div><dt>Audience</dt><dd>Caregivers, families, public, and trainers</dd></div><div><dt>Language</dt><dd>{selected.language}</dd></div><div><dt>Status</dt><dd>Details and registration link coming soon</dd></div></dl><VideoLink /></div></div>}</div></section>;
}

function LearnEvents({ module }) {
  const location = useLocation();
  const page = pageInfo[module] || pageInfo.education; const pathFor = (key) => key === "education" ? "dementia-education" : key === "training" ? "training-resources" : key;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  return <main key={module} className="module-page"><section className="module-hero"><div className="section-container module-hero-grid"><div className="module-intro"><span className="section-label section-label-light">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.intro}</p></div><img src={page.image} alt={page.imageAlt} /></div></section>{module === "education" && <EducationModule />}{module === "training" && <TrainingModule />}{module === "webinars" && <WebinarModule />}{module === "events" && <EventFinder />}<section className="module-nav"><div className="section-container"><p>Explore Learn & Events</p><div>{Object.entries(pageInfo).map(([key, item]) => <Link key={key} to={`/learn-events/${pathFor(key)}`}>{item.eyebrow}</Link>)}</div></div></section></main>;
}

export default LearnEvents;
