import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { activities, trainers } from "../data/educationEvents";
import "./EducationEvents.css";

const sections = {
  online: { label: "Online Education", title: "Learn online, at your own pace.", intro: "Previous and future webinars, recordings, Q&A, and approved learning materials." },
  physical: { label: "Physical Education", title: "Education that brings people together.", intro: "Discover family and trainer-led learning programmes delivered in local communities." },
  events: { label: "Events", title: "Find activities that connect and inform.", intro: "Explore workshops, dialogues, forums, expos, and other approved community activities." },
  trainers: { label: "Certified Trainers", title: "Meet the people delivering community education.", intro: "Browse approved trainer profiles and connect them to upcoming and past activities." },
  calendar: { label: "Upcoming Calendar", title: "One calendar for learning and events.", intro: "Filter online education, physical programmes, and community activities in one place." },
};

function ActivityCard({ activity }) {
  return <article className="activity-card"><div className={`activity-status status-${activity.status.toLowerCase()}`}>{activity.status}</div><span className="activity-type">{activity.type}</span><h2>{activity.title}</h2><p>{activity.description}</p><div className="activity-meta"><span>{activity.date}</span><span>{activity.mode} · {activity.location}</span><span>{activity.language}</span></div><Link className="text-button" to={`/learn-events/activity/${activity.id}`}>View details <span aria-hidden="true">→</span></Link></article>;
}

function Filters({ value, onChange }) {
  return <div className="education-filters"><input aria-label="Search activities" placeholder="Search activities" value={value.query} onChange={(event) => onChange({ ...value, query: event.target.value })} /><select aria-label="Filter by type" value={value.type} onChange={(event) => onChange({ ...value, type: event.target.value })}><option>All types</option><option>RCBC Annual Webinar</option><option>Certified Trainer Webinar</option><option>DCS-Family</option><option>Workshop</option><option>Past Webinar</option></select><select aria-label="Filter by mode" value={value.mode} onChange={(event) => onChange({ ...value, mode: event.target.value })}><option>All modes</option><option>Online</option><option>Physical</option></select><select aria-label="Filter by language" value={value.language} onChange={(event) => onChange({ ...value, language: event.target.value })}><option>All languages</option><option>English</option><option>Bahasa Melayu</option></select></div>;
}

function ActivityListing({ title, description, filterCompleted = false }) {
  const [filters, setFilters] = useState({ query: "", type: "All types", mode: "All modes", language: "All languages" });
  const filtered = useMemo(() => activities.filter((activity) => { const text = `${activity.title} ${activity.description} ${activity.category}`.toLowerCase(); return (!filterCompleted || activity.status === "Completed") && (filters.type === "All types" || activity.type === filters.type) && (filters.mode === "All modes" || activity.mode === filters.mode) && (filters.language === "All languages" || activity.language === filters.language) && text.includes(filters.query.toLowerCase()); }), [filters, filterCompleted]);
  return <><section className="education-page-intro"><div className="section-container"><span className="section-label">{title}</span><h1>{description}</h1><p>Use the filters to find the right activity, then open the activity page for details and external registration.</p></div></section><section className="education-list-section"><div className="section-container"><Filters value={filters} onChange={setFilters} /><p className="results-count">{filtered.length} activity{filtered.length === 1 ? "" : "ies"} found</p><div className="activity-grid">{filtered.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}{filtered.length === 0 && <p className="empty-state">No activities match these filters.</p>}</div></div></section></>;
}

function CalendarPage() {
  return <ActivityListing title="Upcoming Calendar" description="One place to discover online education, physical programmes, and events." />;
}

function TrainerDirectory() {
  return <><section className="education-page-intro"><div className="section-container"><span className="section-label">Certified Trainers</span><h1>Find approved community educators.</h1><p>Trainer profiles show the defined project certification scope. They do not represent broader professional endorsement.</p></div></section><section className="trainer-directory"><div className="section-container"><div className="trainer-grid">{trainers.map((trainer) => <article className="trainer-card" key={trainer.name}><div className="trainer-avatar" aria-hidden="true">{trainer.name.charAt(0)}</div><div><h2>{trainer.name}</h2><p>{trainer.location} · {trainer.language}</p><small>{trainer.certificate}</small><Link className="text-button" to="/learn-events/events">View approved activities ({trainer.activities}) →</Link></div></article>)}</div></div></section></>;
}

function ActivityDetail() {
  const { id } = useParams(); const activity = activities.find((item) => item.id === id);
  if (!activity) return <section className="education-page-intro"><div className="section-container"><h1>Activity not found</h1><Link className="text-button" to="/learn-events/calendar">Return to calendar →</Link></div></section>;
  return <section className="activity-detail"><div className="section-container"><Link className="back-link" to="/learn-events/calendar">← Back to calendar</Link><div className="activity-detail-card"><div><span className="activity-status">{activity.status}</span><span className="activity-type">{activity.type}</span><h1>{activity.title}</h1><p className="detail-description">{activity.description}</p><dl className="detail-meta"><div><dt>Suitable for</dt><dd>{activity.suitableFor}</dd></div><div><dt>Date and time</dt><dd>{activity.date} · {activity.time}</dd></div><div><dt>Mode and location</dt><dd>{activity.mode} · {activity.location}</dd></div><div><dt>Language</dt><dd>{activity.language}</dd></div><div><dt>Speaker / trainer</dt><dd>{activity.trainer}</dd></div></dl></div><aside className="detail-side"><div className="poster-placeholder">Activity<br />poster</div>{activity.registration && <a className="primary-button" href={activity.registration} target="_blank" rel="noreferrer">Register externally ↗</a>}{activity.recording && <a className="primary-button" href={activity.recording} target="_blank" rel="noreferrer">Watch recording ↗</a>}</aside></div><div className="learning-outcomes"><h2>What you will learn</h2><ul>{activity.learn.map((item) => <li key={item}>{item}</li>)}</ul></div></div></section>;
}

function EducationEvents({ section = "calendar", detail = false }) {
  const location = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [location.pathname]);
  if (detail) return <main className="education-events-page" key={location.pathname}><ActivityDetail /></main>;
  const page = sections[section] || sections.calendar;
  return <main className="education-events-page" key={section}><section className="education-hero"><div className="section-container"><span className="section-label section-label-light">Education & Events</span><h1>{page.title}</h1><p>{page.intro}</p></div></section>{section === "trainers" ? <TrainerDirectory /> : <ActivityListing title={page.label} description={page.title} />}</main>;
}

export default EducationEvents;
