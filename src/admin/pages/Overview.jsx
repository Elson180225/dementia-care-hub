import { Link } from "react-router-dom";
import { useTrainer } from "../../trainer-portal/TrainerContext";
import { buildQueue, yearSummary } from "../../trainer-portal/selectors";

export default function Overview() {
  const { state } = useTrainer();
  const queue = buildQueue(state);
  const year = new Date().getFullYear();
  const summary = yearSummary(state.activities, year);
  const approved = state.activities.filter((a) => a.status === "approved").length;

  const byKind = queue.reduce((acc, item) => {
    acc[item.kind] = (acc[item.kind] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <h1>Overview</h1>
      <section className="tp-card" aria-labelledby="needs-action">
        <h2 id="needs-action">Needs your action</h2>
        {queue.length === 0 ? (
          <p>Nothing is waiting for review. 🎉</p>
        ) : (
          <>
            <ul className="tp-list">
              {Object.entries(byKind).map(([kind, count]) => (
                <li key={kind}><strong>{count}</strong> × {kind}</li>
              ))}
            </ul>
            <Link className="tp-btn" to="/admin/review">Go to review queue</Link>
          </>
        )}
      </section>

      <section className="tp-card"><h2>Maintenance and follow-up</h2><ul>{state.maintenance?.map(m=><li key={m.kind}>{m.kind}: {m.count}</li>)}</ul><Link to="/admin/records">Open content and records</Link></section>
      <h2>{year} summary</h2>
      <div className="tp-stats">
        <div className="tp-stat"><span>Approved activities</span><strong>{approved}</strong></div>
        <div className="tp-stat"><span>Verified activities</span><strong>{summary.conducted}</strong></div>
        <div className="tp-stat"><span>Verified contribution hours</span><strong>{state.contributions.filter(c=>Number(c.year)===year).reduce((sum,c)=>sum+Number(c.hours),0)}</strong></div>
        <div className="tp-stat"><span>Participants reached</span><strong>{summary.participants}</strong></div>
      </div>
    </>
  );
}