import { useState } from "react";
import { useTrainer } from "../TrainerContext";
import { COMPLETION_LABEL } from "../constants";
import { yearSummary } from "../selectors";
import { StatusChip } from "../ui";

export default function Hours() {
  const { state } = useTrainer();
  const [filters,setFilters]=useState({location:'',type:'',organiser:''});
  const [year,setYear] = useState(new Date().getFullYear());
  const personal=state.activities.filter(a=>a.completion.status!=="none").filter(a=>(!filters.location||a.city===filters.location)&&(!filters.type||a.type===filters.type)&&(!filters.organiser||a.organiserKind===filters.organiser)).filter(a=>(a.trainers||[]).some(t=>t.trainerId===state.session?.id)).map(a=>({...a,date:a.completion.actualStart||a.date,completion:{...a.completion,status:a.completion.status==='verified'&&a.completion.individualStatus==='verified'?'verified':'pending'}}));
  const summary = yearSummary(personal.filter(a=>!a.cancelledAt&&!a.postponedAt), year);
  const rows = personal
    .filter((a) => a.completion.status !== "none" && new Date(a.date).getFullYear()===year)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <h1>My Training Records</h1>
      <p>Your verified training hours are added up automatically once RCBC has checked your completed activities. Only your own teaching hours count, and you don&apos;t need to enter them again.</p>
      <label className="tp-field">Reporting year<select value={year} onChange={e=>setYear(Number(e.target.value))}>{[...new Set([new Date().getFullYear(),...state.activities.map(a=>new Date(a.date).getFullYear())])].sort((a,b)=>b-a).map(y=><option key={y}>{y}</option>)}</select></label>
      {[['location','Location','city'],['type','Activity type','type'],['organiser','Organiser','organiserKind']].map(([key,label,field])=><label className="tp-field" key={key}>{label}<select value={filters[key]} onChange={e=>setFilters({...filters,[key]:e.target.value})}><option value="">All</option>{[...new Set(state.activities.map(a=>a[field]).filter(Boolean))].sort().map(v=><option key={v} value={v}>{v}</option>)}</select></label>)}
      <a className="tp-btn" href={'/api/portal/education-report?'+new URLSearchParams({year,...filters})}>Download my annual record (XLSX)</a>
      <div className="tp-stats">
        <div className="tp-stat"><span>Conducted in {year}</span><strong>{summary.conducted}</strong></div>
        <div className="tp-stat"><span>Verified training hours</span><strong>{summary.hours}</strong></div>
        <div className="tp-stat"><span>Participant attendances</span><strong>{summary.participants}</strong></div>
      </div>
      <div className="tp-table-wrap">
        <table className="tp-table">
          <caption className="tp-sr">Contribution record</caption>
          <thead>
            <tr><th>Year</th><th>Workshop / Seminar</th><th>Role</th><th>Hours</th><th>Participant attendances</th><th>Status</th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.date).getFullYear()}</td>
                <td>{a.activityReference} · {a.title}</td>
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