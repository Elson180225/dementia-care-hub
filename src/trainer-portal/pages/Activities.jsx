import UploadField from "../UploadField";
import { useEffect, useMemo, useState } from "react";
import { useTrainer } from "../TrainerContext";
import { ACTIVITY_TYPES, LANGUAGES, MODES, STATUS_LABEL } from "../constants";
import { fmtDate } from "../selectors";
import { Field, StatusChip, describe } from "../ui";

const ALL_ADMIN_TYPES = [
  ...ACTIVITY_TYPES,
  "RCBC Webinar",
  "CT Webinar",
  "DCS-Family",
  "DCS-TTT",
  "Expo",
  "Dialogue",
  "Forum",
  "Public Talk",
  "Other",
];

const SARAWAK_DIVISIONS = [
  "Online",
  "Kuching",
  "Bintulu",
  "Miri",
  "Sibu",
  "Kota Samarahan",
  "Sarikei",
  "Mukah",
  "Kapit",
  "Betong",
  "Sri Aman",
  "Limbang",
  "Serian",
];

const blank = {
  title: "",
  date: "",
  type: "Workshop",
  mode: "Online",
  venue: "",
  language: "English",
  audience: "",
  description: "",
  registrationLink: "",
  plannedHours: "",
  city: "",
  posterUrl: "",
  registrationDeadline: "",
  capacity: "",
};

function validate(v) {
  const e = {};
  if (!v.title?.trim()) e.title = "Please enter a title.";
  if (!v.date || Number.isNaN(Date.parse(v.date))) e.date = "Please choose a valid date and time.";
  if (v.mode === "Physical" && !v.venue?.trim()) e.venue = "Please enter the venue.";
  if (!v.audience?.trim()) e.audience = "Please say who this is suitable for.";
  if (!v.description?.trim()) e.description = "Please describe what participants will learn.";
  if (!Number.isFinite(Number(v.plannedHours)) || !(Number(v.plannedHours) > 0)) {
    e.plannedHours = "Please enter planned hours greater than 0.";
  }
  if (v.registrationLink) {
    try {
      const url = new URL(v.registrationLink);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      e.registrationLink = "Please enter a valid registration link starting with http:// or https://.";
    }
  }
  if (v.registrationDeadline) {
    if (Number.isNaN(Date.parse(v.registrationDeadline))) {
      e.registrationDeadline = "Please choose a valid registration deadline.";
    } else if (v.date && new Date(v.registrationDeadline) > new Date(v.date)) {
      e.registrationDeadline = "Please choose a registration deadline on or before the event starts.";
    }
  }
  if (v.capacity && (!Number.isInteger(Number(v.capacity)) || Number(v.capacity) <= 0)) {
    e.capacity = "Please enter a whole number greater than 0 for capacity.";
  }
  return e;
}

export default function Activities({
  admin = false,
  initialFilterType = "all",
  initialFilterMode = "all",
  defaultValues = null,
  pageTitle,
  pageSubtitle,
  newButtonLabel,
}) {
  const { state, dispatch } = useTrainer();
  const [uploading, setUploading] = useState(0);
  const uploadBusy = (busy) => setUploading((n) => n + (busy ? 1 : -1));
  const [editing, setEditing] = useState(null); // { id?, values }
  const [errors, setErrors] = useState({});
  const [availableTrainers, setAvailableTrainers] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [cancelling, setCancelling] = useState(null); // { id, reason, error }

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState(initialFilterType || "all");
  const [filterMode, setFilterMode] = useState(initialFilterMode || "all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetch("/api/portal/trainers")
      .then((r) => r.json())
      .then(setAvailableTrainers)
      .catch(() => {});
  }, []);

  const review = (id, decision, comment = "") =>
    dispatch({ type: "ADMIN_REVIEW", target: "activity", id, decision, comment });

  async function confirmCancel() {
    const reason = cancelling.reason.trim();
    if (!reason) {
      setCancelling({ ...cancelling, error: "Please give a short reason. It is shown on the public listing." });
      return;
    }
    if (await review(cancelling.id, "cancelled", reason)) {
      setCancelling(null);
    }
  }

  const open = (a) => {
    setErrors({});
    setAssigned(a?.trainers || (admin ? [] : [{ trainerId: state.session?.id, role: "Trainer" }]));
    setEditing(
      a
        ? {
            id: a.id,
            values: Object.fromEntries(Object.keys(blank).map((k) => [k, a[k] ?? ""])),
          }
        : { values: { ...blank, ...(defaultValues || {}) } }
    );
  };

  const change = (e) => {
    const { name, value } = e.target;
    let nextValues = { ...editing.values, [name]: value };
    if (name === "mode") {
      if (value === "Online") {
        nextValues.venue = "Online";
        if (!nextValues.city || nextValues.city === "") nextValues.city = "Online";
      } else if (value === "Physical" && nextValues.venue === "Online") {
        nextValues.venue = "";
        if (nextValues.city === "Online") nextValues.city = "";
      }
    }
    setEditing({ ...editing, values: nextValues });
    const found = validate(nextValues);
    setErrors((previous) =>
      Object.fromEntries(
        Object.keys(previous)
          .filter((f) => found[f])
          .map((f) => [f, found[f]])
      )
    );
  };

  const checkField = (e) => {
    const name = e.target.name;
    if (!name || !(name in blank)) return;
    setErrors((previous) => ({ ...previous, [name]: validate(editing.values)[name] }));
  };

  async function save(saveMode = "draft") {
    const found = validate(editing.values);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    const id = editing.id ?? crypto.randomUUID();
    const venue = editing.values.mode === "Online" ? "Online" : editing.values.venue;
    const payload = { id, ...editing.values, venue, trainers: assigned };

    const ok = await dispatch({ type: "ACTIVITY_SAVE", activity: payload });
    if (!ok) return;

    if (admin && saveMode === "publish") {
      const currentStatus = state.activities.find((a) => a.id === id)?.status || "draft";
      if (currentStatus === "draft" || currentStatus === "returned") {
        await dispatch({ type: "ACTIVITY_SUBMIT", id });
        await dispatch({ type: "ADMIN_REVIEW", target: "activity", id, decision: "approved" });
        await dispatch({ type: "ADMIN_REVIEW", target: "activity", id, decision: "published" });
      } else if (currentStatus === "submitted") {
        await dispatch({ type: "ADMIN_REVIEW", target: "activity", id, decision: "approved" });
        await dispatch({ type: "ADMIN_REVIEW", target: "activity", id, decision: "published" });
      } else if (currentStatus === "approved") {
        await dispatch({ type: "ADMIN_REVIEW", target: "activity", id, decision: "published" });
      }
    } else if (saveMode === "submit") {
      await dispatch({ type: "ACTIVITY_SUBMIT", id });
    }
    setEditing(null);
  }

  // Filter and pagination computations
  const allCities = useMemo(() => {
    const set = new Set();
    state.activities.forEach((a) => {
      if (a.city?.trim()) set.add(a.city.trim());
    });
    return [...set].sort();
  }, [state.activities]);

  const filteredActivities = useMemo(() => {
    return state.activities.filter((a) => {
      if (filterType !== "all" && a.type !== filterType) return false;
      if (filterMode !== "all" && a.mode !== filterMode) return false;
      if (filterStatus !== "all") {
        if (filterStatus === "cancelled") {
          if (!a.cancelledAt) return false;
        } else if (a.status !== filterStatus) {
          return false;
        }
      }
      if (filterCity !== "all" && a.city !== filterCity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          a.title?.toLowerCase().includes(q) ||
          a.venue?.toLowerCase().includes(q) ||
          a.city?.toLowerCase().includes(q) ||
          a.language?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.audience?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [state.activities, filterType, filterMode, filterStatus, filterCity, searchQuery]);

  const totalCount = filteredActivities.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const safePage = Math.min(page, totalPages);
  const pagedActivities = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, safePage, pageSize]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    filterType !== "all" ||
    filterMode !== "all" ||
    filterStatus !== "all" ||
    filterCity !== "all";

  const resetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterMode("all");
    setFilterStatus("all");
    setFilterCity("all");
    setPage(1);
  };

  const v = editing?.values;
  const input = (name, label, props = {}) => (
    <Field id={name} label={label} error={errors[name]} hint={props.hint}>
      <input
        id={name}
        name={name}
        value={v[name]}
        onChange={change}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={describe(name, errors[name], props.hint)}
        {...props}
      />
    </Field>
  );

  // EDIT / CREATE FORM VIEW
  if (editing) {
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h1 style={{ margin: 0 }}>
            {editing.id ? (admin ? "Edit Event / Workshop" : "Edit workshop / seminar") : (admin ? "New Event / Workshop" : "New workshop / seminar")}
          </h1>
          <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setEditing(null)}>
            ← Back to Listing
          </button>
        </div>

        <form className="tp-card" noValidate onBlur={checkField} onSubmit={(e) => e.preventDefault()}>
          {input("title", "Title", { placeholder: "e.g. Dementia Care Skill Course (Family)" })}
          {input("date", "Date & time", { type: "datetime-local" })}

          <Field id="type" label="Activity type">
            <select id="type" name="type" value={v.type} onChange={change}>
              {(admin ? ALL_ADMIN_TYPES : ACTIVITY_TYPES).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>

          <Field id="mode" label="Online or physical">
            <select id="mode" name="mode" value={v.mode} onChange={change}>
              {MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>

          {v.mode === "Physical" && input("venue", "Venue / location", { placeholder: "e.g. Hock Lee Hotel, Kuching" })}

          <Field id="language" label="Language">
            <select id="language" name="language" value={v.language} onChange={change}>
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>

          {input("audience", "Suitable for (Target Audience)", {
            placeholder: "e.g. Family caregivers, frontline nurses, general public",
            hint: "Specifies who this programme is designed for. Displayed on public event cards, details modal, and calendar.",
          })}

          <Field id="description" label="What participants will learn" error={errors.description}>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={v.description}
              onChange={change}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={describe("description", errors.description)}
              placeholder="Detailed description of topics, learning outcomes, and schedule..."
            />
          </Field>

          {input("registrationLink", "External registration link (optional)", {
            type: "url",
            placeholder: "https://forms.google.com/...",
            hint: "Google Form or external ticketing URL. If blank, 'Registration coming soon' is shown.",
          })}

          {input("plannedHours", "Planned contribution hours", { type: "number", min: "0", step: "0.5" })}

          <fieldset className="tp-field">
            <legend>Assigned Activity Trainers</legend>
            <p style={{ margin: "0.25rem 0 0.75rem", fontSize: "0.9rem", color: "#61596a" }}>
              Assign certified trainers responsible for leading or facilitating this session.
            </p>
            {assigned.map((t, i) => (
              <div key={i} className="tp-actions" style={{ marginBottom: "0.5rem" }}>
                <select
                  aria-label="Trainer"
                  value={t.trainerId}
                  onChange={(e) =>
                    setAssigned(
                      assigned.map((x, j) => (i === j ? { ...x, trainerId: e.target.value } : x))
                    )
                  }
                >
                  {availableTrainers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city || "Sarawak"})
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Activity role"
                  value={t.role}
                  onChange={(e) =>
                    setAssigned(
                      assigned.map((x, j) => (i === j ? { ...x, role: e.target.value } : x))
                    )
                  }
                >
                  {["Trainer", "Co-Trainer", "Speaker"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="tp-btn tp-btn-ghost"
                  style={{ minHeight: "44px", padding: "6px 14px" }}
                  onClick={() => setAssigned(assigned.filter((_, j) => i !== j))}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="tp-btn tp-btn-ghost"
              style={{ minHeight: "44px", padding: "6px 16px", marginTop: "0.5rem" }}
              onClick={() =>
                setAssigned([
                  ...assigned,
                  { trainerId: availableTrainers[0]?.id || state.session?.id, role: "Co-Trainer" },
                ])
              }
            >
              + Add Trainer
            </button>
          </fieldset>

          <Field
            id="city"
            label="City / Division"
            error={errors.city}
            hint="Select a standard Sarawak division or enter custom locality. For online webinars, select 'Online'."
          >
            <input
              id="city"
              name="city"
              list="sarawak-divisions-list"
              value={v.city}
              onChange={change}
              placeholder="e.g. Kuching, Bintulu, Miri, Sibu, Online"
            />
            <datalist id="sarawak-divisions-list">
              {SARAWAK_DIVISIONS.map((div) => (
                <option key={div} value={div} />
              ))}
            </datalist>
          </Field>
          {input("registrationDeadline", "Registration deadline", {
            type: "datetime-local",
            hint: "Optional. Once this date passes, the public card displays 'Registration Closed' and disables registration.",
          })}
          {input("capacity", "Seat Capacity (optional)", {
            type: "number",
            min: "1",
            step: "1",
            placeholder: "e.g. 50, 100",
            hint: "Displays capacity badge on public activity card and calendar.",
          })}

          <UploadField
            onBusyChange={uploadBusy}
            label="Activity poster"
            kind="poster"
            value={v.posterUrl}
            onChange={(posterUrl) => setEditing({ ...editing, values: { ...v, posterUrl } })}
          />

          <div className="tp-actions" style={{ marginTop: "1.5rem" }}>
            {admin ? (
              <>
                <button
                  type="button"
                  className="tp-btn"
                  disabled={uploading > 0}
                  onClick={() => save("publish")}
                  title="Saves and immediately publishes this event to the public website"
                >
                  Save &amp; Publish Live
                </button>
                <button
                  type="button"
                  className="tp-btn tp-btn-ghost"
                  disabled={uploading > 0}
                  onClick={() => save("draft")}
                >
                  Save as Draft
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="tp-btn"
                  disabled={uploading > 0}
                  onClick={() => save("submit")}
                >
                  Submit for Admin review
                </button>
                <button
                  type="button"
                  className="tp-btn tp-btn-ghost"
                  disabled={uploading > 0}
                  onClick={() => save("draft")}
                >
                  Save as draft
                </button>
              </>
            )}
            <button
              type="button"
              className="tp-btn tp-btn-ghost"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      </>
    );
  }

  // LISTING VIEW
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>{pageTitle || (admin ? "Events & Workshop Management" : "Workshop & Seminar")}</h1>
          <p style={{ margin: "0.25rem 0 0", color: "#61596a", fontSize: "0.95rem" }}>
            {pageSubtitle ||
              (admin
                ? "Create and manage all community events, workshops, dialogues, and online sessions."
                : "Submit your own activities. RCBC Admin reviews them before they appear in Education & Events.")}
          </p>
        </div>
        <button
          className="tp-btn"
          onClick={() => open(null)}
          style={{ minWidth: "180px", whiteSpace: "nowrap" }}
        >
          {newButtonLabel || (admin ? "+ New Event / Workshop" : "+ New Workshop / Seminar")}
        </button>
      </div>

      {/* Metric Stats Cards */}
      <div className="tp-stats">
        <div className="tp-stat">
          <span>Total Records</span>
          <strong>{state.activities.length}</strong>
        </div>
        <div className="tp-stat">
          <span>Published Live</span>
          <strong style={{ color: "#0d716b" }}>
            {state.activities.filter((a) => a.status === "published" && !a.cancelledAt).length}
          </strong>
        </div>
        <div className="tp-stat">
          <span>In Review / Draft</span>
          <strong style={{ color: "#b45309" }}>
            {state.activities.filter((a) => ["draft", "submitted", "returned"].includes(a.status) && !a.cancelledAt).length}
          </strong>
        </div>
        <div className="tp-stat">
          <span>Completed / Archived</span>
          <strong style={{ color: "#475569" }}>
            {state.activities.filter((a) => ["completed", "verified", "archived"].includes(a.status) || Boolean(a.cancelledAt)).length}
          </strong>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="tp-filter-bar">
        <input
          type="text"
          className="tp-search-input"
          placeholder="🔍 Search events by title, venue, city, description..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          aria-label="Search activities"
        />

        <select
          className="tp-select-filter"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by type"
        >
          <option value="all">All Types</option>
          {(admin ? ALL_ADMIN_TYPES : ACTIVITY_TYPES).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          className="tp-select-filter"
          value={filterMode}
          onChange={(e) => {
            setFilterMode(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by mode"
        >
          <option value="all">All Modes</option>
          <option value="Online">Online</option>
          <option value="Physical">Physical</option>
        </select>

        <select
          className="tp-select-filter"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="approved">Approved</option>
          <option value="submitted">Submitted</option>
          <option value="draft">Draft</option>
          <option value="returned">Returned</option>
          <option value="completed">Completed</option>
          <option value="verified">Verified</option>
          <option value="archived">Archived</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {allCities.length > 0 && (
          <select
            className="tp-select-filter"
            value={filterCity}
            onChange={(e) => {
              setFilterCity(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by city"
          >
            <option value="all">All Cities</option>
            {allCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            className="tp-btn tp-btn-ghost"
            style={{ minHeight: "42px", padding: "6px 14px", fontSize: "0.88rem" }}
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Results Header & Items Per Page */}
      <div className="tp-table-meta">
        <div>
          Showing <strong>{totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1}</strong>–
          <strong>{Math.min(safePage * pageSize, totalCount)}</strong> of{" "}
          <strong>{totalCount}</strong> activities
          {hasActiveFilters && " (filtered)"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label htmlFor="tp-page-size-select" style={{ fontSize: "0.88rem" }}>Rows per page:</label>
          <select
            id="tp-page-size-select"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #877991" }}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {/* Main Data Table */}
      {totalCount === 0 ? (
        <div className="tp-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: "1.1rem", color: "#61596a", margin: 0 }}>
            {hasActiveFilters
              ? "No activities matched your search or filters."
              : "No activities found. Click '+ New Event / Workshop' to schedule your first session."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="tp-btn tp-btn-ghost"
              style={{ marginTop: "1rem" }}
              onClick={resetFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="tp-table-wrap">
          <table className="tp-table">
            <thead>
              <tr>
                <th style={{ minWidth: "220px" }}>Title &amp; Type</th>
                <th style={{ minWidth: "150px" }}>Date &amp; Schedule</th>
                <th style={{ minWidth: "140px" }}>Mode &amp; Location</th>
                <th style={{ minWidth: "150px" }}>Capacity &amp; Deadline</th>
                <th style={{ minWidth: "110px" }}>Status</th>
                <th style={{ minWidth: "180px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedActivities.map((a) => {
                const isDeadlinePassed =
                  a.registrationDeadline && new Date() > new Date(a.registrationDeadline);
                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "#1f2937", marginBottom: "4px" }}>
                        {a.title}
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, background: "#f3e8ff", color: "#6b21a8", padding: "2px 8px", borderRadius: "4px" }}>
                          {a.type}
                        </span>
                        {(a.audience || a.suitableFor) && (
                          <span style={{ fontSize: "0.82rem", color: "#4b5563" }}>
                            🎯 Suitable for: <strong>{a.audience || a.suitableFor}</strong>
                          </span>
                        )}
                      </div>
                      {a.trainers?.length > 0 && (
                        <div style={{ fontSize: "0.82rem", color: "#4338ca", marginTop: "3px" }}>
                          👤 Assigned Trainers:{" "}
                          <strong>
                            {a.trainers
                              .map((t) =>
                                t.name
                                  ? (t.role ? `${t.name} (${t.role})` : t.name)
                                  : availableTrainers.find((p) => p.id === t.trainerId)?.name || "Trainer"
                              )
                              .join(", ")}
                          </strong>
                        </div>
                      )}
                      {a.cancelledAt && (
                        <div style={{ color: "#991b1b", fontSize: "0.82rem", marginTop: "4px" }}>
                          ⚠️ Cancelled: {a.cancellation_reason}
                        </div>
                      )}
                      {a.status === "returned" && a.adminComment && (
                        <div style={{ color: "#b45309", fontSize: "0.82rem", marginTop: "4px" }}>
                          Admin Note: {a.adminComment}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: "#374151" }}>
                        {fmtDate(a.date)}
                      </div>
                      {a.plannedHours && (
                        <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>
                          ⏱️ {a.plannedHours} hrs
                        </div>
                      )}
                    </td>

                    <td>
                      <span className={`tp-badge-mode ${a.mode === "Online" ? "tp-badge-online" : "tp-badge-physical"}`}>
                        {a.mode}
                      </span>
                      <div style={{ fontSize: "0.85rem", color: "#4b5563", marginTop: "4px" }}>
                        {a.mode === "Online"
                          ? "Online"
                          : a.venue && a.city && a.venue !== a.city && !a.venue.toLowerCase().includes(a.city.toLowerCase())
                          ? `${a.venue}, ${a.city}`
                          : a.venue || a.city || "—"}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: "0.88rem" }}>
                        👥 {a.capacity ? `${a.capacity} seats` : "No limit"}
                      </div>
                      {a.registrationDeadline ? (
                        <div style={{ fontSize: "0.82rem", color: isDeadlinePassed ? "#dc2626" : "#6b7280", marginTop: "2px" }}>
                          ⏳ {fmtDate(a.registrationDeadline)}
                          {isDeadlinePassed && <span style={{ fontWeight: 700 }}> (Closed)</span>}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.82rem", color: "#9ca3af" }}>No deadline</div>
                      )}
                    </td>

                    <td>
                      <StatusChip status={a.status} labels={STATUS_LABEL} />
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {(!a.cancelledAt &&
                          (admin
                            ? ["draft", "returned", "approved", "published"].includes(a.status)
                            : ["draft", "returned"].includes(a.status) && a.created_by === state.session?.id)) && (
                          <button
                            type="button"
                            className="tp-btn tp-btn-ghost"
                            style={{ minHeight: "36px", padding: "4px 12px", fontSize: "0.85rem" }}
                            onClick={() => open(a)}
                          >
                            Edit
                          </button>
                        )}

                        {admin && (
                          <>
                            {a.status === "approved" && !a.cancelledAt && (
                              <button
                                type="button"
                                className="tp-btn"
                                style={{ minHeight: "36px", padding: "4px 12px", fontSize: "0.85rem" }}
                                onClick={() => review(a.id, "published")}
                              >
                                Publish
                              </button>
                            )}

                            {a.status === "published" && !a.cancelledAt && (
                              <button
                                type="button"
                                className="tp-btn tp-btn-ghost"
                                style={{ minHeight: "36px", padding: "4px 12px", fontSize: "0.85rem" }}
                                onClick={() => review(a.id, "unpublished")}
                              >
                                Unpublish
                              </button>
                            )}

                            {["approved", "published"].includes(a.status) &&
                              !a.cancelledAt &&
                              cancelling?.id !== a.id && (
                                <button
                                  type="button"
                                  className="tp-btn tp-btn-ghost"
                                  style={{ minHeight: "36px", padding: "4px 12px", fontSize: "0.85rem", color: "#b91c1c", borderColor: "#fca5a5" }}
                                  onClick={() => setCancelling({ id: a.id, reason: "", error: "" })}
                                >
                                  Cancel
                                </button>
                              )}

                            {(a.status === "verified" || (a.cancelledAt && a.status !== "archived")) && (
                              <button
                                type="button"
                                className="tp-btn tp-btn-ghost"
                                style={{ minHeight: "36px", padding: "4px 12px", fontSize: "0.85rem" }}
                                onClick={() => review(a.id, "archived")}
                              >
                                Archive
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Cancel prompt sub-row */}
                      {cancelling?.id === a.id && (
                        <div style={{ marginTop: "10px", textAlign: "left", background: "#fef2f2", border: "1px solid #fecaca", padding: "10px", borderRadius: "8px" }}>
                          <Field id={`cancel-${a.id}`} label="Reason for cancellation" error={cancelling.error}>
                            <textarea
                              id={`cancel-${a.id}`}
                              rows="2"
                              value={cancelling.reason}
                              onChange={(e) =>
                                setCancelling({ ...cancelling, reason: e.target.value, error: "" })
                              }
                              aria-invalid={Boolean(cancelling.error)}
                              aria-describedby={describe(`cancel-${a.id}`, cancelling.error)}
                              placeholder="e.g. Rescheduled due to speaker availability..."
                            />
                          </Field>
                          <div className="tp-actions" style={{ marginTop: "8px" }}>
                            <button
                              type="button"
                              className="tp-btn"
                              style={{ minHeight: "36px", padding: "4px 12px", fontSize: "0.85rem", background: "#b91c1c" }}
                              onClick={confirmCancel}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="tp-btn tp-btn-ghost"
                              style={{ minHeight: "36px", padding: "4px 12px", fontSize: "0.85rem" }}
                              onClick={() => setCancelling(null)}
                            >
                              Keep Activity
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="tp-pagination">
          <button
            type="button"
            className="tp-page-btn"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            ‹ Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
            // Show first page, last page, and pages around current page
            if (num === 1 || num === totalPages || (num >= safePage - 2 && num <= safePage + 2)) {
              return (
                <button
                  key={num}
                  type="button"
                  className={`tp-page-btn ${num === safePage ? "active" : ""}`}
                  onClick={() => setPage(num)}
                  aria-label={`Page ${num}`}
                  aria-current={num === safePage ? "page" : undefined}
                >
                  {num}
                </button>
              );
            }
            if (num === safePage - 3 || num === safePage + 3) {
              return <span key={num} style={{ padding: "0 4px", color: "#877991" }}>…</span>;
            }
            return null;
          })}

          <button
            type="button"
            className="tp-page-btn"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
          >
            Next ›
          </button>
        </div>
      )}
    </>
  );
}
