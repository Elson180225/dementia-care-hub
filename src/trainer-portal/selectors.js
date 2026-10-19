export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" }) : "";

const sum = (rows, pick) => rows.reduce((total, row) => total + Number(pick(row) || 0), 0);

export function yearSummary(activities, year) {
  const rows = activities.filter(
    (a) => a.completion.status === "verified" && new Date(a.date).getFullYear() === year
  );
  return {
    conducted: rows.length,
    hours: sum(rows, (a) => a.completion.hours),
    participants: sum(rows, (a) => a.completion.participants),
  };
}

export function pendingCount(profile, activities) {
  return (
    (profile.status === "submitted" ? 1 : 0) +
    activities.filter((a) => a.status === "submitted").length +
    activities.filter((a) => a.completion.status === "submitted").length
  );
}

export function buildQueue({ accessRequests, profile, profiles = [profile], activities }) {
  const items = [];

  accessRequests
    .filter((r) => r.status === "submitted")
    .forEach((r) =>
      items.push({
        key: `access-${r.id}`,
        target: "access",
        id: r.id,
        kind: "Trainer access request",
        title: r.name,
        detail: `${r.email} · ${r.city} · Certificate ref: ${r.certificateRef}`,
        approveLabel: "Approve access",
        canReject: true,
      })
    );

  profiles.filter(p => p.status === "submitted").forEach(p => items.push({
    key:`profile-${p.id}`, target:"profile", id:p.id, kind:"Trainer profile update", title:p.name,
    detail:`${p.city} ? ${p.language}`, approveLabel:"Approve update"
  }));

  activities
    .filter((a) => a.status === "submitted")
    .forEach((a) =>
      items.push({
        key: `activity-${a.id}`,
        target: "activity",
        id: a.id,
        kind: "Workshop / Seminar submission",
        title: a.title,
        detail: `${fmtDate(a.date)} · ${a.mode} · ${a.language}`,
        approveLabel: "Approve activity",
      })
    );

  activities
    .filter((a) => a.completion.status === "submitted")
    .forEach((a) =>
      items.push({
        key: `completion-${a.id}`,
        target: "completion",
        id: a.id,
        kind: "Completed activity record",
        title: a.title,
        detail: `${a.completion.participants} participants · ${a.completion.hours} hours`,
        approveLabel: "Verify record",
      })
    );

  return items;
}

// Lifecycle: Draft → Submitted → Approved/Returned → Published → Completed → Verified → Archived
export function lifecycleStage(a) {
  if (a.archived) return "archived";
  if (a.cancelled) return "cancelled";
  if (a.completion.status === "verified") return "verified";
  if (a.completion.status === "submitted") return "completed";
  if (a.status === "approved") return a.published ? "published" : "approved";
  return a.status; // draft | submitted | returned
}

// Verified or cancelled records can be archived. RCBC-run activities have no trainer
// completion step, so they can be archived once their date has passed.
export const canArchive = (a) =>
  !a.archived &&
  (a.cancelled ||
    a.completion.status === "verified" ||
    (a.source === "rcbc" && new Date(a.date) < new Date()));

export const today = () => new Date().toISOString().slice(0, 10);

export const reviewDue = (record, days = 365) =>
  (Date.now() - new Date(record.lastReviewed).getTime()) / 86400000 > days;

// Trainer views show only the trainer's own activities, not RCBC-created ones.
export const mine = (activities) => activities.filter((a) => a.source !== "rcbc");