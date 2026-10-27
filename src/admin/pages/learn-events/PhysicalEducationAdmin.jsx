import { useState, useMemo } from "react";
import Activities from "../../../trainer-portal/pages/Activities";
import UploadField from "../../../trainer-portal/UploadField";

const BLANK_PROGRAMME = {
  id: "",
  code: "",
  trackNumber: "Track 01",
  title: "",
  roleCategory: "",
  badge: "Open for Registration",
  shortIntro: "",
  suitableFor: "",
  description: "",
  mode: "In-Person Physical Workshop",
  sessions: "1 Full Day (9:00 AM – 6:00 PM)",
  language: "English / Bahasa Melayu / 中文",
  location: "Kuching",
  schedule: {
    date: "",
    time: "9:00 AM – 5:00 PM",
    label: "Scheduled Intake",
  },
  image: "",
  highlights: [],
  buttonLabel: "Register for Programme",
};

export default function PhysicalEducationAdmin({ content, onSave }) {
  // Sub-tabs: "tracks" | "sessions"
  const [subSection, setSubSection] = useState("tracks");
  const [editingProg, setEditingProg] = useState(null); // null or { values, isNew, rawHighlights }
  const [deletingConfirm, setDeletingConfirm] = useState(null); // null or { id, title, code }
  const [errors, setErrors] = useState({});

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [badgeFilter, setBadgeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const programmes = content?.physicalEducation?.programmes || [];

  // Filter computation
  const filteredProgrammes = useMemo(() => {
    return programmes.filter((p) => {
      if (badgeFilter !== "all" && p.badge !== badgeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          p.title?.toLowerCase().includes(q) ||
          p.code?.toLowerCase().includes(q) ||
          p.trackNumber?.toLowerCase().includes(q) ||
          p.roleCategory?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.shortIntro?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [programmes, badgeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredProgrammes.length / pageSize) || 1;
  const safePage = Math.min(page, totalPages);
  const pagedProgrammes = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProgrammes.slice(start, start + pageSize);
  }, [filteredProgrammes, safePage, pageSize]);

  // Open Edit Modal
  const openEdit = (prog) => {
    setErrors({});
    const hl = Array.isArray(prog.highlights) ? prog.highlights.join("\n") : prog.highlights || "";
    setEditingProg({
      isNew: false,
      values: JSON.parse(JSON.stringify(prog)),
      rawHighlights: hl,
    });
  };

  // Open Create Modal
  const openCreate = () => {
    setErrors({});
    const nextNum = programmes.length + 1;
    const pad = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    setEditingProg({
      isNew: true,
      values: {
        ...BLANK_PROGRAMME,
        id: `dcs-track-${Date.now()}`,
        trackNumber: `Track ${pad}`,
      },
      rawHighlights: "Module 1 – Basic Dementia Understanding\nModule 2 – Person-Centred Care\nModule 3 – Effective Communication",
    });
  };

  // Save Modal
  const handleSaveModal = async () => {
    const v = editingProg.values;
    const errs = {};
    if (!v.code?.trim()) errs.code = "Please enter a track code (e.g. DCS-Family).";
    if (!v.title?.trim()) errs.title = "Please enter the programme title.";
    if (!v.roleCategory?.trim()) errs.roleCategory = "Please specify who this track is designed for.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const hlArray = (editingProg.rawHighlights || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedProg = {
      ...v,
      highlights: hlArray,
    };

    const copy = JSON.parse(JSON.stringify(content));
    if (!copy.physicalEducation) copy.physicalEducation = { programmes: [] };
    if (!Array.isArray(copy.physicalEducation.programmes)) copy.physicalEducation.programmes = [];

    if (editingProg.isNew) {
      copy.physicalEducation.programmes.push(updatedProg);
    } else {
      const idx = copy.physicalEducation.programmes.findIndex((p) => p.id === updatedProg.id);
      if (idx >= 0) {
        copy.physicalEducation.programmes[idx] = updatedProg;
      } else {
        copy.physicalEducation.programmes.push(updatedProg);
      }
    }

    const ok = await onSave(copy);
    if (ok) setEditingProg(null);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deletingConfirm) return;
    const copy = JSON.parse(JSON.stringify(content));
    if (copy.physicalEducation?.programmes) {
      copy.physicalEducation.programmes = copy.physicalEducation.programmes.filter(
        (p) => p.id !== deletingConfirm.id
      );
    }
    const ok = await onSave(copy);
    if (ok) setDeletingConfirm(null);
  };

  return (
    <div className="physical-education-admin">
      {/* Sub-navigation bar */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #e5e7eb", marginBottom: "1.25rem" }}>
        <button
          type="button"
          onClick={() => setSubSection("tracks")}
          style={{
            padding: "0.6rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: subSection === "tracks" ? "3px solid #0d716b" : "3px solid transparent",
            color: subSection === "tracks" ? "#0d716b" : "#4b5563",
            fontWeight: subSection === "tracks" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          🏛️ DCS Certification Tracks ({programmes.length})
        </button>
        <button
          type="button"
          onClick={() => setSubSection("sessions")}
          style={{
            padding: "0.6rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: subSection === "sessions" ? "3px solid #0d716b" : "3px solid transparent",
            color: subSection === "sessions" ? "#0d716b" : "#4b5563",
            fontWeight: subSection === "sessions" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          🏋️ Physical Workshops &amp; In-Person Sessions
        </button>
      </div>

      {/* SUB-SECTION 1: DCS TRACKS TABLE */}
      {subSection === "tracks" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>DCS Learning Tracks Management</h2>
              <p style={{ margin: "0.25rem 0 0", color: "#61596a", fontSize: "0.9rem" }}>
                Configure in-person training pathways, module pillars, schedules, and registration criteria.
              </p>
            </div>
            <button
              type="button"
              className="tp-btn"
              onClick={openCreate}
              style={{ minWidth: "180px", whiteSpace: "nowrap" }}
            >
              + Add New DCS Track
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="tp-filter-bar">
            <input
              type="text"
              className="tp-search-input"
              placeholder="🔍 Search tracks by code, title, audience, location..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              aria-label="Search programmes"
            />

            <select
              className="tp-select-filter"
              value={badgeFilter}
              onChange={(e) => {
                setBadgeFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by badge"
            >
              <option value="all">All Status Badges</option>
              <option value="Open for Registration">Open for Registration</option>
              <option value="By Application & Review">By Application &amp; Review</option>
              <option value="Future Track • Priority Waitlist">Future Track • Priority Waitlist</option>
            </select>

            {(searchQuery.trim() !== "" || badgeFilter !== "all") && (
              <button
                type="button"
                className="tp-btn tp-btn-ghost"
                onClick={() => {
                  setSearchQuery("");
                  setBadgeFilter("all");
                  setPage(1);
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Results Counter & Page Size */}
          <div className="tp-table-meta">
            <div>
              Showing <strong>{filteredProgrammes.length === 0 ? 0 : (safePage - 1) * pageSize + 1}</strong>–
              <strong>{Math.min(safePage * pageSize, filteredProgrammes.length)}</strong> of{" "}
              <strong>{filteredProgrammes.length}</strong> tracks
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label htmlFor="pe-pagesize" style={{ fontSize: "0.88rem" }}>Rows per page:</label>
              <select
                id="pe-pagesize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #877991" }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredProgrammes.length === 0 ? (
            <div className="tp-card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "#61596a", margin: 0 }}>No DCS programmes match your search criteria.</p>
            </div>
          ) : (
            <div className="tp-table-wrap">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: "120px" }}>Track #</th>
                    <th style={{ minWidth: "220px" }}>Code &amp; Title</th>
                    <th style={{ minWidth: "180px" }}>Target Audience</th>
                    <th style={{ minWidth: "160px" }}>Mode &amp; Sessions</th>
                    <th style={{ minWidth: "150px" }}>Scheduled Intake</th>
                    <th style={{ minWidth: "130px" }}>Status Badge</th>
                    <th style={{ minWidth: "140px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProgrammes.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: "#0d716b", background: "#f0fdf4", padding: "2px 8px", borderRadius: "4px", fontSize: "0.82rem" }}>
                          {p.trackNumber || "Track"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#1f2937", marginBottom: "2px" }}>
                          {p.code}
                        </div>
                        <div style={{ fontSize: "0.88rem", color: "#4b5563" }}>
                          {p.title}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "#374151" }}>
                          {p.roleCategory}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0f766e" }}>
                          {p.mode}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                          {p.sessions}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1f2937" }}>
                          {p.schedule?.date || "TBD"}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                          {p.schedule?.time}
                        </div>
                        {p.location && (
                          <div style={{ fontSize: "0.78rem", color: "#4b5563", marginTop: "2px" }}>
                            📍 {p.location}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "12px",
                            background: p.badge?.includes("Open") ? "#ecfdf5" : p.badge?.includes("Review") ? "#fef3c7" : "#f3f4f6",
                            color: p.badge?.includes("Open") ? "#047857" : p.badge?.includes("Review") ? "#b45309" : "#4b5563",
                            border: "1px solid",
                            borderColor: p.badge?.includes("Open") ? "#a7f3d0" : p.badge?.includes("Review") ? "#fde68a" : "#e5e7eb",
                          }}
                        >
                          {p.badge}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="tp-btn tp-btn-ghost"
                            style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.82rem" }}
                            onClick={() => openEdit(p)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="tp-btn tp-btn-ghost"
                            style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.82rem", color: "#b91c1c", borderColor: "#fca5a5" }}
                            onClick={() => setDeletingConfirm({ id: p.id, title: p.title, code: p.code })}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="tp-pagination">
              <button
                type="button"
                className="tp-page-btn"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`tp-page-btn ${num === safePage ? "active" : ""}`}
                  onClick={() => setPage(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="tp-page-btn"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-SECTION 2: LIVE PHYSICAL SESSIONS DB TABLE */}
      {subSection === "sessions" && (
        <div>
          <div style={{ background: "#f8fafc", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>🏋️ In-Person Training &amp; Community Workshop Hub</h3>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569" }}>
              Manage in-person sessions, community workshops, hospital cohorts, and public roadshows. Live entries automatically synchronize with the main website events directory and upcoming calendar.
            </p>
          </div>
          <Activities
            admin={true}
            initialFilterMode="Physical"
            pageTitle="Physical Workshops & In-Person Sessions"
            pageSubtitle="Scheduled physical events, DCS cohorts, and venue-based community trainings across Sarawak."
            newButtonLabel="+ New In-Person Session"
            defaultValues={{ mode: "Physical", type: "Workshop" }}
          />
        </div>
      )}

      {/* EDIT / CREATE TRACK MODAL */}
      {editingProg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1rem", overflowY: "auto" }}>
          <div style={{ background: "#fff", borderRadius: "10px", maxWidth: "780px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "1.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, color: "#0d716b" }}>
                {editingProg.isNew ? "Create New DCS Track" : `Edit Track: ${editingProg.values.code}`}
              </h3>
              <button
                type="button"
                className="tp-btn tp-btn-ghost"
                onClick={() => setEditingProg(null)}
                style={{ minHeight: "32px", padding: "2px 8px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Track Number *
                </label>
                <input
                  type="text"
                  value={editingProg.values.trackNumber}
                  onChange={(e) =>
                    setEditingProg({
                      ...editingProg,
                      values: { ...editingProg.values, trackNumber: e.target.value },
                    })
                  }
                  placeholder="e.g. Track 01"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Track Code *
                </label>
                <input
                  type="text"
                  value={editingProg.values.code}
                  onChange={(e) =>
                    setEditingProg({
                      ...editingProg,
                      values: { ...editingProg.values, code: e.target.value },
                    })
                  }
                  placeholder="e.g. DCS-Family"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: errors.code ? "1px solid #dc2626" : "1px solid #ccc" }}
                />
                {errors.code && <div style={{ color: "#dc2626", fontSize: "0.78rem", marginTop: "2px" }}>{errors.code}</div>}
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Status Badge
                </label>
                <input
                  type="text"
                  value={editingProg.values.badge}
                  onChange={(e) =>
                    setEditingProg({
                      ...editingProg,
                      values: { ...editingProg.values, badge: e.target.value },
                    })
                  }
                  placeholder="e.g. Open for Registration"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Full Programme Title *
              </label>
              <input
                type="text"
                value={editingProg.values.title}
                onChange={(e) =>
                  setEditingProg({
                    ...editingProg,
                    values: { ...editingProg.values, title: e.target.value },
                  })
                }
                placeholder="e.g. Basic Dementia Care Skill (Family) Course"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: errors.title ? "1px solid #dc2626" : "1px solid #ccc" }}
              />
              {errors.title && <div style={{ color: "#dc2626", fontSize: "0.78rem", marginTop: "2px" }}>{errors.title}</div>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Role Category / Audience Summary *
                </label>
                <input
                  type="text"
                  value={editingProg.values.roleCategory}
                  onChange={(e) =>
                    setEditingProg({
                      ...editingProg,
                      values: { ...editingProg.values, roleCategory: e.target.value },
                    })
                  }
                  placeholder="e.g. Family Caregivers, Relatives & Community Helpers"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: errors.roleCategory ? "1px solid #dc2626" : "1px solid #ccc" }}
                />
                {errors.roleCategory && <div style={{ color: "#dc2626", fontSize: "0.78rem", marginTop: "2px" }}>{errors.roleCategory}</div>}
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Action Button Text
                </label>
                <input
                  type="text"
                  value={editingProg.values.buttonLabel || ""}
                  onChange={(e) =>
                    setEditingProg({
                      ...editingProg,
                      values: { ...editingProg.values, buttonLabel: e.target.value },
                    })
                  }
                  placeholder="e.g. Register for DCS-Family"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Purpose Quote / Short Intro
              </label>
              <textarea
                rows={2}
                value={editingProg.values.shortIntro || ""}
                onChange={(e) =>
                  setEditingProg({
                    ...editingProg,
                    values: { ...editingProg.values, shortIntro: e.target.value },
                  })
                }
                placeholder="To shift the daily caregiving focus away from rigid clinical routines..."
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Who This Is Designed For (Detailed)
              </label>
              <textarea
                rows={2}
                value={editingProg.values.suitableFor || ""}
                onChange={(e) =>
                  setEditingProg({
                    ...editingProg,
                    values: { ...editingProg.values, suitableFor: e.target.value },
                  })
                }
                placeholder="Detailed explanation of target participants..."
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Mode
                </label>
                <input
                  type="text"
                  value={editingProg.values.mode || ""}
                  onChange={(e) =>
                    setEditingProg({
                      ...editingProg,
                      values: { ...editingProg.values, mode: e.target.value },
                    })
                  }
                  placeholder="e.g. In-Person Physical Workshop"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Sessions / Duration
                </label>
                <input
                  type="text"
                  value={editingProg.values.sessions || ""}
                  onChange={(e) =>
                    setEditingProg({
                      ...editingProg,
                      values: { ...editingProg.values, sessions: e.target.value },
                    })
                  }
                  placeholder="e.g. 1 Full Day (9:00 AM – 6:00 PM)"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Language(s)
                </label>
                <input
                  type="text"
                  value={editingProg.values.language || ""}
                  onChange={(e) =>
                    setEditingProg({
                      ...editingProg,
                      values: { ...editingProg.values, language: e.target.value },
                    })
                  }
                  placeholder="e.g. English / Bahasa Melayu / 中文"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Venue / Location
                </label>
                <input
                  type="text"
                  value={editingProg.values.location || ""}
                  onChange={(e) =>
                    setEditingProg({
                      ...editingProg,
                      values: { ...editingProg.values, location: e.target.value },
                    })
                  }
                  placeholder="e.g. Hock Lee Hotel & Residence, Kuching"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Scheduled Date
                </label>
                <input
                  type="text"
                  value={editingProg.values.schedule?.date || ""}
                  onChange={(e) =>
                    setEditingProg({
                      ...editingProg,
                      values: {
                        ...editingProg.values,
                        schedule: { ...editingProg.values.schedule, date: e.target.value },
                      },
                    })
                  }
                  placeholder="e.g. 16 May 2026"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Scheduled Time
                </label>
                <input
                  type="text"
                  value={editingProg.values.schedule?.time || ""}
                  onChange={(e) =>
                    setEditingProg({
                      ...editingProg,
                      values: {
                        ...editingProg.values,
                        schedule: { ...editingProg.values.schedule, time: e.target.value },
                      },
                    })
                  }
                  placeholder="e.g. 9:00 AM – 6:00 PM"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Core Learning Pillars / Highlights (One per line)
              </label>
              <textarea
                rows={4}
                value={editingProg.rawHighlights || ""}
                onChange={(e) => setEditingProg({ ...editingProg, rawHighlights: e.target.value })}
                placeholder="Module 1 – Basic DCS&#10;Module 2 – Person-Centred Care"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", fontFamily: "monospace", fontSize: "0.88rem" }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <UploadField
                kind="poster"
                label="Track Visual Poster / Photo"
                value={editingProg.values.image}
                onChange={(url) =>
                  setEditingProg({
                    ...editingProg,
                    values: { ...editingProg.values, image: url },
                  })
                }
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid #e5e7eb", paddingTop: "1rem" }}>
              <button
                type="button"
                className="tp-btn tp-btn-ghost"
                onClick={() => setEditingProg(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tp-btn"
                onClick={handleSaveModal}
              >
                {editingProg.isNew ? "Create Track" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "10px", maxWidth: "480px", width: "100%", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 0.5rem", color: "#991b1b" }}>Confirm Track Deletion</h3>
            <p style={{ margin: "0 0 1rem", color: "#4b5563", fontSize: "0.95rem" }}>
              Are you sure you want to delete <strong>{deletingConfirm.code} — {deletingConfirm.title}</strong>? This track will be removed from the public website showcase.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="tp-btn tp-btn-ghost"
                onClick={() => setDeletingConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tp-btn"
                style={{ background: "#dc2626", borderColor: "#dc2626", color: "#fff" }}
                onClick={handleDeleteConfirm}
              >
                Yes, Delete Track
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
