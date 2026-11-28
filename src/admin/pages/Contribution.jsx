import { useState } from 'react';
import { eventDateTime } from '../../../shared/event-dates';
import { useTrainer } from '../../trainer-portal/TrainerContext';

function downloadContributionCsv(year, contributions) {
  const rows = [
    ['Year', 'Trainer', 'Activity', 'Role', 'Hours', 'Participants'],
    ...contributions.map(t => [year, t.name, t.activity.title, t.role, t.hours, t.activity.completion.participants]),
  ];
  const csv = rows.map(row => row.map(value => {
    const text = String(value ?? '');
    const safe = /^[=+\-@]/.test(text) ? "'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
  }).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'trainer-contribution.csv';
  link.click();
  URL.revokeObjectURL(url);
}

const statusLabels = {
  pending: 'Awaiting trainer confirmation',
  returned: 'Correction requested',
  confirmed: 'Ready to verify',
  verified: 'Verified',
};

function ContributionActions({ activity, trainer, dispatch }) {
  const [action, setAction] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const status = trainer.contributionStatus || 'pending';
  const canConfirm = status === 'pending' || status === 'returned';

  function close() {
    setAction('');
    setNote('');
  }

  async function submit(decision) {
    setSaving(true);
    try {
      const saved = await dispatch({
        type: decision === 'confirm' ? 'CONTRIBUTION_CONFIRM' : 'CONTRIBUTION_REVIEW',
        id: activity.id,
        trainerId: trainer.trainerId,
        ...(decision === 'confirm' ? {} : { decision }),
        comment: decision === 'verified' ? '' : note.trim(),
      });
      if (saved) close();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <strong>{statusLabels[status] || status}</strong>
      {trainer.reviewComment && <p>{trainer.reviewComment}</p>}
      {activity.completion.status === 'none' ? <p>Complete the activity report to start the review.</p>
        : trainer.hours == null || Number(trainer.hours) > activity.completion.eventHours
          ? <p>Check the trainer’s hours in the activity report before reviewing.</p>
          : action ? (
            <form onSubmit={e => { e.preventDefault(); if (note.trim()) submit(action); }}>
              <label className="tp-field">
                {action === 'confirm' ? 'How did the trainer confirm their hours?' : 'What should the trainer correct?'}
                <textarea rows={2} required value={note} onChange={e => setNote(e.target.value)} />
              </label>
              <div className="tp-actions">
                <button className="tp-btn" disabled={saving || !note.trim()}>
                  {action === 'confirm' ? 'Save trainer confirmation' : 'Send correction request'}
                </button>
                <button className="tp-btn tp-btn-ghost" type="button" disabled={saving} onClick={close}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="tp-actions">
              {canConfirm && <button className="tp-btn tp-btn-ghost" onClick={() => setAction('confirm')}>
                Record confirmation received outside the portal
              </button>}
              {status === 'confirmed' && <button className="tp-btn" disabled={saving} onClick={() => submit('verified')}>Verify hours</button>}
              {['confirmed', 'verified'].includes(status) && <button className="tp-btn tp-btn-ghost" disabled={saving} onClick={() => setAction('returned')}>
                Request correction
              </button>}
            </div>
          )}
    </>
  );
}

export default function Contribution() {
  const { state, dispatch } = useTrainer();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [filters, setFilters] = useState({location: '', type: '', organiser: ''});
  const rows = state.activities.filter(a =>
    (a.completion.actualStart || a.date)?.slice(0, 4) === year &&
    (!filters.location || a.city === filters.location) &&
    (!filters.type || a.type === filters.type) &&
    (!filters.organiser || a.organiserKind === filters.organiser) &&
    !a.cancelledAt && !a.postponedAt
  );
  const verified = rows.filter(a => a.completion.status === 'verified');
  const people = rows.flatMap(a => (a.trainers || []).map(t => ({...t, activity: a})));
  const verifiedPeople = people.filter(t => t.activity.completion.status === 'verified' && t.contributionStatus === 'verified');
  const totals = [
    ['Active trainers', new Set(verifiedPeople.filter(t => Number(t.hours) > 0).map(t => t.trainerId)).size],
    ['Verified activities', verified.length],
    ['Net activity hours', verified.reduce((n, a) => n + Number(a.completion.eventHours || 0), 0)],
    ['Verified trainer hours', verifiedPeople.reduce((n, t) => n + Number(t.hours || 0), 0)],
    ['Participants', verified.reduce((n, a) => n + Number(a.completion.participants || 0), 0)],
  ];

  return (
    <>
      <h1>Trainer contributions and annual reports</h1>
      <section className="tp-card" aria-label="Annual report">
        <div className="tp-form-grid">
          <label className="tp-field">Reporting year
            <input type="number" min="2000" max="2200" value={year} onChange={e => setYear(e.target.value)} />
          </label>
          {[['location','Location','city'], ['type','Activity type','type'], ['organiser','Organiser','organiserKind']].map(([key,label,field]) => (
            <label className="tp-field" key={key}>{label}
              <select value={filters[key]} onChange={e => setFilters({...filters,[key]:e.target.value})}>
                <option value="">All</option>
                {[...new Set(state.activities.map(a => a[field]).filter(Boolean))].sort().map(value => <option key={value}>{value}</option>)}
              </select>
            </label>
          ))}
        </div>
        <dl className="tp-stats">
          {totals.map(([label, value]) => <div key={label} className="tp-stat"><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
        <p>Participant totals count each activity’s attendance once. Trainer hours count only after both the activity and the individual hours have been verified.</p>
        <div className="tp-actions">
          {/^\d{4}$/.test(year) && Number(year) >= 2000 && Number(year) <= 2200
            ? <a className="tp-btn" href={'/api/admin/education-reports?' + new URLSearchParams({year,...filters})}>Download annual Excel report</a>
            : <p>Enter a reporting year between 2000 and 2200 to download the report.</p>}
          <button type="button" className="tp-btn tp-btn-ghost" disabled={!verifiedPeople.length} onClick={() => downloadContributionCsv(year, verifiedPeople)}>Download trainer hours (CSV)</button>
        </div>
      </section>
      <h2>Review trainer hours</h2>
      <div className="tp-table-wrap" role="region" aria-label="Trainer hours review" tabIndex={0}>
        <table className="tp-table tp-contribution-table">
          <thead><tr><th>Activity</th><th>Trainer / topic / role</th><th>Hours</th><th>Review</th></tr></thead>
          <tbody>
            {people.map(trainer => {
              const activity = trainer.activity;
              const date = activity.completion.actualStart || activity.date;
              return (
                <tr key={activity.id + ':' + trainer.trainerId}>
                  <td><strong>{activity.title}</strong><br />{activity.activityReference}<br />
                    {activity.organiserName}<br />{date ? eventDateTime(date + '+08:00') : 'Date to be confirmed'}</td>
                  <td>{trainer.name}<br />{trainer.topic || 'Topic to be recorded'} · {trainer.role}</td>
                  <td>{trainer.hours ?? '—'}</td>
                  <td><ContributionActions activity={activity} trainer={trainer} dispatch={dispatch} /></td>
                </tr>
              );
            })}
            {!people.length && <tr><td colSpan="4">No contributions match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
