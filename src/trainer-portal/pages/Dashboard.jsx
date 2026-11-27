import { Link } from "react-router-dom";
import { useTrainer } from "../TrainerContext";
import { fmtDate, pendingCount, yearSummary } from "../selectors";
import { STATUS_LABEL } from "../constants";
import { StatusChip } from "../ui";

export default function Dashboard() {
  const { state } = useTrainer();
  const { profile, activities } = state;
  const year = new Date().getFullYear();
  const summary = yearSummary(activities.filter(a=>a.completion.individualStatus==='verified'), year);
  const upcoming = activities.filter(
    (a) => ["approved","published"].includes(a.status) && a.completion.status === "none" && new Date(a.date) >= new Date()
  );

  return (
    <>
      <h1>Dashboard</h1>
      <div className="tp-stats">
        <div className="tp-stat"><span>Profile status</span><StatusChip status={profile.status} labels={STATUS_LABEL} /></div>
        <div className="tp-stat"><span>Waiting for RCBC review</span><strong>{pendingCount(profile, activities)}</strong></div>
        <div className="tp-stat"><span>Completed activities in {year}</span><strong>{summary.conducted}</strong></div>
        <div className="tp-stat"><span>Verified training hours</span><strong>{summary.hours}</strong></div>
        <div className="tp-stat"><span>Participant attendances</span><strong>{summary.participants}</strong></div>
      </div>

      <section className="tp-card">
        <h2>Upcoming training activities</h2>
        {upcoming.length === 0 ? (
          <p>You have no upcoming training activities yet. <Link to="/trainer-portal/activities">Add a training activity</Link>.</p>
        ) : (
          <ul className="tp-list">
            {upcoming.map((a) => (
              <li key={a.id}><strong>{a.title}</strong> – {fmtDate(a.date)} ({a.mode})</li>
            ))}
          </ul>
        )}
      </section>

      <p className="tp-note">
        Your teaching scope depends on your verified classification.{" "}
        <Link to="/trainer-portal/eligibility">Check your eligibility &amp; teaching conditions</Link>
      </p>
    </>
  );
}
