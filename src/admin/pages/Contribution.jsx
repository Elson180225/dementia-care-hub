import { useState } from "react";
import { useTrainer } from "../../trainer-portal/TrainerContext";
import { buildAnnualReport, reportYears } from "../annualReport";
import { buildXlsx } from "../xlsx";

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
  const years = reportYears(state.activities);
  const [reportYear, setReportYear] = useState(years[0]);
  const report = buildAnnualReport(state, reportYear);
  const rows = state.activities
    .filter((a) => a.completion.status === "verified")
    .sort((a, b) => b.date.localeCompare(a.date));

  const totals = rows.reduce((acc, a) => {
    const year = new Date(a.date).getFullYear();
    acc[year] ??= { activities: 0, hours: 0, participants: 0 };
    acc[year].activities += 1;
    acc[year].hours += (a.trainers||[]).reduce((total,t)=>total+Number(t.hours||0),0);
    acc[year].participants += Number(a.completion.participants || 0);
    return acc;
  }, {});

  const trainerRows=rows.flatMap(a=>(a.trainers || []).map(t=>({...a,trainerId:t.trainerId,trainerName:state.profiles.find(p=>p.id===t.trainerId)?.name || t.trainerId,role:t.role,individualHours:Number(t.hours||0)})));
  function exportAnnualReport() {
    const bytes = buildXlsx(report.sheets);
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = report.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const head = ["Year", "Trainer", "Activity", "Role", "Hours", "Participants"];
    const body = trainerRows.map((a) => [
      new Date(a.date).getFullYear(), a.trainerName, a.title, a.role,
      a.individualHours, a.completion.participants,
    ]);
    download("trainer-contribution.csv", toCsv([head, ...body]));
  }

  return (
    <>
      <h1>Trainer Hours &amp; Reports</h1>
      <p>Hours are added up automatically from completed activities you have checked. Nobody needs to enter them twice.</p>

      <section className="tp-card">
        <h2>Annual training report</h2>
        <p>One Excel workbook with five sheets: Annual Summary, Activity Master, Trainer Contribution, Trainer Annual Summary, and Geographical &amp; Activity Analysis. Only verified activities count.</p>
        <label className="tp-field">Reporting year
          <select value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <div className="tp-stats">
          <div className="tp-stat"><span>Verified activities</span><strong>{report.totals.activities}</strong></div>
          <div className="tp-stat"><span>Active trainers</span><strong>{report.totals.activeTrainers}</strong></div>
          <div className="tp-stat"><span>Participant attendances</span><strong>{report.totals.attendance}</strong></div>
          <div className="tp-stat"><span>Trainer contribution hours</span><strong>{report.totals.trainerHours}</strong></div>
          <div className="tp-stat"><span>Net activity hours</span><strong>{report.totals.activityHours}</strong></div>
          <div className="tp-stat"><span>Locations reached</span><strong>{report.totals.places}</strong></div>
        </div>
        <div className="tp-actions">
          <button className="tp-btn" onClick={exportAnnualReport}>Download {reportYear} annual report (Excel)</button>
          <button className="tp-btn tp-btn-ghost" onClick={exportCsv} disabled={rows.length === 0}>Download trainer hours (CSV)</button>
        </div>
      </section>

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
                <td>{a.individualHours}</td>
                <td>{a.completion.participants}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
