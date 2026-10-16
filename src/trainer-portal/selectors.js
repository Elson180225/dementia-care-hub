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