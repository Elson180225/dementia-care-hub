import { useTrainer } from "../../trainer-portal/TrainerContext";

// Stops spreadsheet programs from running text that starts with = + - @ as a formula.
const safe = (v) => {
  const s = String(v ?? "");
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
};

function toCsv(rows) {
  const esc = (v) => `"${safe(v).replace(/"/g, '""')}"`;
  return rows.map((r) => r.map(esc).join(",")).join("\r\n");
}

function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Contribution() {
  const { state } = useTrainer();
  const rows = state.activities
    .filter((a) => a.completion.status === "verified")
    .sort((a, b) => b.date.localeCompare(a.date));

  const totals = rows.reduce((acc, a) => {
    const year = new Date(a.date).getFullYear();
    acc[year] ??= { activities: 0, hours: 0, participants: 0 };
    acc[year].activities += 1;
    acc[year].hours += Number(a.completion.hours || 0);
    acc[year].participants += Number(a.completion.participants || 0);
    return acc;
  }, {});

  const trainerRows=rows.flatMap(a=>(a.trainers || []).map(t=>({...a,trainerId:t.trainerId,trainerName:state.profiles.find(p=>p.id===t.trainerId)?.name || t.trainerId,role:t.role})));
  function exportCsv() {
    const head = ["Year", "Trainer", "Activity", "Role", "Hours", "Participants"];
    const body = trainerRows.map((a) => [
      new Date(a.date).getFullYear(), a.trainerName, a.title, a.role,
      a.completion.hours, a.completion.participants,
    ]);
    download("trainer-contribution.csv", toCsv([head, ...body]));
  }

  return (
    <>
      <h1>Trainer hours</h1>
      <p>Hours are added up automatically from completed activities you have checked. Nobody needs to enter them twice.</p>
      <button className="tp-btn" onClick={exportCsv} disabled={rows.length === 0}>Download as spreadsheet (CSV)</button>

      <h2>Totals by year</h2>
      <div className="tp-table-wrap">
        <table className="tp-table">
          <caption className="tp-sr">Totals by year</caption>
          <thead><tr><th>Year</th><th>Activities</th><th>Hours</th><th>Participants</th></tr></thead>
          <tbody>
            {Object.entries(totals).map(([year, t]) => (
              <tr key={year}><td>{year}</td><td>{t.activities}</td><td>{t.hours}</td><td>{t.participants}</td></tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="4">No checked activities yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Hours by trainer</h2>
      <div className="tp-table-wrap">
        <table className="tp-table">
          <caption className="tp-sr">Hours by trainer</caption>
          <thead><tr><th>Year</th><th>Trainer</th><th>Activity</th><th>Role</th><th>Hours</th><th>Participants</th></tr></thead>
          <tbody>
            {trainerRows.map((a) => (
              <tr key={`${a.id}-${a.trainerId}`}>
                <td>{new Date(a.date).getFullYear()}</td>
                <td>{a.trainerName}</td>
                <td>{a.title}</td>
                <td>{a.role}</td>
                <td>{a.completion.hours}</td>
                <td>{a.completion.participants}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}