import { useTrainer } from "../TrainerContext";
import { COMPLETION_LABEL } from "../constants";
import { yearSummary } from "../selectors";
import { StatusChip } from "../ui";

export default function Hours() {
  const { state } = useTrainer();
  const year = new Date().getFullYear();
  const summary = yearSummary(state.activities, year);
  const rows = state.activities
    .filter((a) => a.completion.status !== "none")
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <h1>Contribution & Training Hours</h1>
      <p>Hours come from your completed activity records after Admin verification. You do not need to enter them again.</p>
      <div className="tp-stats">
        <div className="tp-stat"><span>Conducted in {year}</span><strong>{summary.conducted}</strong></div>
        <div className="tp-stat"><span>Verified hours</span><strong>{summary.hours}</strong></div>
        <div className="tp-stat"><span>Participants reached</span><strong>{summary.participants}</strong></div>
      </div>
      <div className="tp-table-wrap">
        <table className="tp-table">
          <caption className="tp-sr">Contribution record</caption>
          <thead>
            <tr><th>Year</th><th>Workshop / Seminar</th><th>Role</th><th>Hours</th><th>Participants</th><th>Status</th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.date).getFullYear()}</td>
                <td>{a.title}</td>
                <td>{a.role}</td>
                <td>{a.completion.status === "verified" ? a.completion.hours : "–"}</td>
                <td>{a.completion.status === "verified" ? a.completion.participants : "–"}</td>
                <td><StatusChip status={a.completion.status} labels={COMPLETION_LABEL} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="6">No completed activities yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}