import { Link } from "react-router-dom";
import { useTrainer } from "../../trainer-portal/TrainerContext";
import {
  buildQueue,
  yearSummary,
} from "../../trainer-portal/selectors";

export default function Overview() {
  const { state } = useTrainer();

  const activities = Array.isArray(state.activities)
    ? state.activities
    : [];

  const contributions = Array.isArray(state.contributions)
    ? state.contributions
    : [];

  const maintenance = Array.isArray(state.maintenance)
    ? state.maintenance
    : [];

  const queue = buildQueue({
    ...state,
    activities,
    accessRequests: Array.isArray(state.accessRequests)
      ? state.accessRequests
      : [],
    profiles: Array.isArray(state.profiles)
      ? state.profiles
      : [state.profile].filter(Boolean),
  });

  // Approved activities waiting to be published
  const toPublish = activities.filter(
    (a) =>
      a.status === "approved" &&
      !a.cancelledAt &&
      !a.cancelled_at
  ).length;

  // Count maintenance items that need attention.
  // The backend returns maintenance counts rather than state.records.
  const dueRecords = maintenance
    .filter((item) => item.kind !== "Enquiries")
    .reduce(
      (total, item) => total + Number(item.count || 0),
      0
    );

  const nothing =
    queue.length === 0 &&
    toPublish === 0 &&
    dueRecords === 0;

  const year = new Date().getFullYear();
  const summary = yearSummary(activities, year);

  const approved = activities.filter(
    (a) => a.status === "approved"
  ).length;

  // Group review queue items by type
  const byKind = queue.reduce((acc, item) => {
    acc[item.kind] = (acc[item.kind] ?? 0) + 1;
    return acc;
  }, {});

  // Calculate contribution hours for the current year
  const contributionHours = contributions
    .filter((c) => Number(c.year) === year)
    .reduce(
      (sum, c) => sum + Number(c.hours),
      0
    );

  return (
    <>
      <h1>Overview</h1>

      {/* Needs your action */}
      <section className="tp-card" aria-labelledby="needs-action">
        <h2 id="needs-action">Needs your action</h2>

        {nothing ? (
          <p>Nothing needs action right now.</p>
        ) : (
          <>
            <ul className="tp-list">
              {Object.entries(byKind).map(([kind, count]) => (
                <li key={kind}>
                  <strong>{count}</strong> × {kind}
                </li>
              ))}

              {toPublish > 0 && (
                <li>
                  <strong>{toPublish}</strong> × Approved activity
                  waiting to be published (
                  <Link to="/admin/activities">
                    Activities
                  </Link>
                  )
                </li>
              )}

              {dueRecords > 0 && (
                <li>
                  <strong>{dueRecords}</strong> × Directory, learning
                  resource, content page, or FAQ items needing review (
                  <Link to="/admin/records">
                    Directory &amp; content
                  </Link>
                  )
                </li>
              )}
            </ul>

            {queue.length > 0 && (
              <Link className="tp-btn" to="/admin/review">
                Go to review queue
              </Link>
            )}
          </>
        )}
      </section>

      {/* Maintenance and follow-up */}
      <section className="tp-card">
        <h2>Maintenance and follow-up</h2>

        <ul>
          {maintenance.map((m) => (
            <li key={m.kind}>
              {m.kind}: {m.count}
            </li>
          ))}
        </ul>

        <Link to="/admin/records">
          Open content and records
        </Link>
      </section>

      {/* Yearly summary */}
      <h2>{year} summary</h2>

      <div className="tp-stats">
        <div className="tp-stat">
          <span>Approved activities</span>
          <strong>{approved}</strong>
        </div>

        <div className="tp-stat">
          <span>Verified activities</span>
          <strong>{summary.conducted}</strong>
        </div>

        <div className="tp-stat">
          <span>Verified contribution hours</span>
          <strong>{contributionHours}</strong>
        </div>

        <div className="tp-stat">
          <span>Participants reached</span>
          <strong>{summary.participants}</strong>
        </div>
      </div>
    </>
  );
}