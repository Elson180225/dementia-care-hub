// Annual Training Activity & Impact Report (RCBC Trainer Portal Draft 02 section 10,
// Admin Portal Draft 02 section 16.4). Five views of the same verified records:
// nothing is typed in twice, and only RCBC-verified activities count.
//
// Counting rules from RCBC:
// - Activities: unique verified activities.
// - Net activity hours: each activity's actual duration, counted once.
// - Trainer hours: each trainer's own verified teaching hours (two trainers
//   co-facilitating 2 hours = 2 activity hours, 4 trainer hours).
// - Attendance: counted once per activity; attendances are not unique people.

const round = (n) => Math.round(Number(n || 0) * 100) / 100;
const yearOf = (activity) => Number(String(activity.date || '').slice(0, 4));
const placeOf = (activity) => activity.city || activity.completion?.venue || activity.venue || (activity.mode === 'Online' ? 'Online' : 'Not recorded');

export function reportYears(activities) {
  const years = new Set(activities.filter((a) => a.completion?.status === 'verified').map(yearOf));
  years.add(new Date().getFullYear());
  return [...years].filter(Number.isFinite).sort((a, b) => b - a);
}

export function buildAnnualReport({ activities = [], profiles = [], users = [] }, year) {
  const nameOf = (id) => profiles.find((p) => p.id === id)?.name || users.find((u) => u.id === id)?.name || 'Unknown trainer';
  const submittedBy = (activity) => (users.find((u) => u.id === activity.created_by)?.role === 'admin' ? 'RCBC admin' : 'Trainer');

  const verified = activities
    .filter((a) => a.completion?.status === 'verified' && yearOf(a) === Number(year))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const contributions = verified.flatMap((a) => (a.trainers || []).map((t) => ({
    activity: a,
    trainerId: t.trainerId,
    trainer: t.name || nameOf(t.trainerId),
    role: t.role || 'Trainer',
    hours: round(t.hours),
  })));

  const activityHours = round(verified.reduce((sum, a) => sum + Number(a.completion.eventHours || 0), 0));
  const trainerHours = round(contributions.reduce((sum, c) => sum + c.hours, 0));
  const attendance = verified.reduce((sum, a) => sum + Number(a.completion.participants || 0), 0);
  const activeTrainers = new Set(contributions.filter((c) => c.hours > 0).map((c) => c.trainerId));
  const places = new Set(verified.map(placeOf));
  const ref = (a) => `ACT-${String(a.id).replace(/-/g, '').slice(0, 8).toUpperCase()}`;

  const countBy = (key) => {
    const groups = new Map();
    for (const a of verified) {
      const label = key(a);
      const g = groups.get(label) || { activities: 0, attendance: 0, hours: 0 };
      g.activities += 1;
      g.attendance += Number(a.completion.participants || 0);
      g.hours = round(g.hours + Number(a.completion.eventHours || 0));
      groups.set(label, g);
    }
    return [...groups].sort((x, y) => y[1].activities - x[1].activities);
  };

  const summary = [
    ['Indicator', 'Value', 'How it is counted'],
    ['Reporting year', Number(year), 'Verified activities dated in this year'],
    ['Verified activities', verified.length, 'Unique activities verified by RCBC'],
    ['Active trainers', activeTrainers.size, 'Trainers with verified teaching hours in the year'],
    ['Participant attendances', attendance, 'Actual attendance, counted once per activity (not unique people)'],
    ['Trainer contribution hours', trainerHours, 'Sum of each trainer’s own verified teaching hours'],
    ['Net activity hours', activityHours, 'Actual duration of each activity, counted once'],
    ['Locations reached', places.size, 'Distinct cities or venues'],
    ...countBy(submittedBy).map(([label, g]) => [`Activities submitted by ${label}`, g.activities, 'Who created the activity record']),
    [],
    ['Generated', new Date().toISOString().slice(0, 10), 'From verified records in the Admin Portal; hours do not measure teaching quality'],
  ];

  const master = [
    ['Activity ref', 'Date', 'Title', 'Type', 'Mode', 'City', 'Venue', 'Language', 'Submitted by', 'Net activity hours', 'Attendance', 'Trainers'],
    ...verified.map((a) => [ref(a), String(a.date).slice(0, 10), a.title, a.type, a.mode, a.city || '', a.completion.venue || a.venue || '', a.language || '', submittedBy(a), round(a.completion.eventHours), Number(a.completion.participants || 0), (a.trainers || []).length]),
  ];

  const contributionSheet = [
    ['Activity ref', 'Date', 'Activity', 'Trainer', 'Role', 'Verified teaching hours'],
    ...contributions.map((c) => [ref(c.activity), String(c.activity.date).slice(0, 10), c.activity.title, c.trainer, c.role, c.hours]),
  ];

  const byTrainer = new Map();
  for (const c of contributions) {
    const t = byTrainer.get(c.trainerId) || { name: c.trainer, activities: 0, hours: 0, attendance: 0 };
    t.activities += 1;
    t.hours = round(t.hours + c.hours);
    t.attendance += Number(c.activity.completion.participants || 0);
    byTrainer.set(c.trainerId, t);
  }
  const trainerSummary = [
    ['Trainer', 'Activities', 'Verified teaching hours', 'Attendance at their activities'],
    ...[...byTrainer.values()].sort((a, b) => a.name.localeCompare(b.name)).map((t) => [t.name, t.activities, t.hours, t.attendance]),
  ];

  const section = (title, rows) => [[title], ['Group', 'Activities', 'Attendance', 'Net activity hours'], ...rows.map(([label, g]) => [label, g.activities, g.attendance, g.hours]), []];
  const analysis = [
    ...section('By location', countBy(placeOf)),
    ...section('By activity type', countBy((a) => a.type || 'Not recorded')),
    ...section('By mode', countBy((a) => a.mode || 'Not recorded')),
    ...section('By submitted by', countBy(submittedBy)),
  ];

  return {
    filename: `RCBC_Training_Annual_Report_${year}.xlsx`,
    totals: { activities: verified.length, activeTrainers: activeTrainers.size, attendance, trainerHours, activityHours, places: places.size },
    sheets: [
      { name: '01 Annual Summary', rows: summary },
      { name: '02 Activity Master', rows: master },
      { name: '03 Trainer Contribution', rows: contributionSheet },
      { name: '04 Trainer Annual Summary', rows: trainerSummary },
      { name: '05 Geographical & Activity', rows: analysis },
    ],
  };
}
