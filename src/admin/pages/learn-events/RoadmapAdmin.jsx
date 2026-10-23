import { useState, useMemo } from "react";
import UploadField from "../../../trainer-portal/UploadField";

const BLANK_HIGHLIGHT = {
  num: "01",
  phase: "",
  title: "",
  desc: "",
  tag: "Phase",
  dotClass: "dot-1",
};

const BLANK_ROADMAP = {
  id: "",
  editionLabel: "2026 Edition",
  title: "",
  theme: "",
  period: "January 2026 – June 2026",
  intro: "",
  image: "",
  highlights: [
    {
      num: "01",
      phase: "Phase 1",
      title: "Public Education & Awareness",
      desc: "Community webinars and outreach dialogues.",
      tag: "Outreach",
      dotClass: "dot-1",
    },
  ],
};

export default function RoadmapAdmin({ content, onSave }) {
  const [editingEdition, setEditingEdition] = useState(null); // null or { values, isNew }
  const [deletingConfirm, setDeletingConfirm] = useState(null);
  const [errors, setErrors] = useState({});

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const roadmaps = content?.events?.roadmap || [];

  const filteredRoadmaps = useMemo(() => {
    return roadmaps.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          r.title?.toLowerCase().includes(q) ||
          r.editionLabel?.toLowerCase().includes(q) ||
          r.theme?.toLowerCase().includes(q) ||
          r.period?.toLowerCase().includes(q) ||
          r.intro?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [roadmaps, searchQuery]);

  const totalPages = Math.ceil(filteredRoadmaps.length / pageSize) || 1;
  const safePage = Math.min(page, totalPages);
  const pagedRoadmaps = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRoadmaps.slice(start, start + pageSize);
  }, [filteredRoadmaps, safePage, pageSize]);

  const openEdit = (edition) => {
    setErrors({});
    setEditingEdition({
      isNew: false,
      values: JSON.parse(JSON.stringify(edition)),
    });
  };

  const openCreate = () => {
    setErrors({});
    setEditingEdition({
      isNew: true,
      values: {
        ...BLANK_ROADMAP,
        id: `roadmap-${Date.now()}`,
      },
    });
  };

  const handleHighlightChange = (idx, field, value) => {
    const nextHl = [...(editingEdition.values.highlights || [])];
    nextHl[idx] = { ...nextHl[idx], [field]: value };
    setEditingEdition({
      ...editingEdition,
      values: { ...editingEdition.values, highlights: nextHl },
    });
  };

  const handleAddHighlight = () => {
    const nextHl = [...(editingEdition.values.highlights || [])];
    const nextNum = nextHl.length + 1;
    const pad = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    nextHl.push({
      ...BLANK_HIGHLIGHT,
      num: pad,
      dotClass: `dot-${(nextNum % 3) + 1}`,
    });
    setEditingEdition({
      ...editingEdition,
      values: { ...editingEdition.values, highlights: nextHl },
    });
  };

  const handleRemoveHighlight = (idx) => {
    const nextHl = editingEdition.values.highlights.filter((_, i) => i !== idx);
    setEditingEdition({
      ...editingEdition,
      values: { ...editingEdition.values, highlights: nextHl },
    });
  };

  const handleSaveModal = async () => {
    const v = editingEdition.values;
    const errs = {};
    if (!v.editionLabel?.trim()) errs.editionLabel = "Please enter an edition label.";
    if (!v.title?.trim()) errs.title = "Please enter the roadmap title.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const copy = JSON.parse(JSON.stringify(content));
    if (!copy.events) copy.events = {};
    if (!Array.isArray(copy.events.roadmap)) copy.events.roadmap = [];

    if (editingEdition.isNew) {
      copy.events.roadmap.push(v);
    } else {
      const idx = copy.events.roadmap.findIndex((r) => r.id === v.id);
      if (idx >= 0) copy.events.roadmap[idx] = v;
      else copy.events.roadmap.push(v);
    }

    const ok = await onSave(copy);
    if (ok) setEditingEdition(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingConfirm) return;
    const copy = JSON.parse(JSON.stringify(content));
    if (copy.events?.roadmap) {
      copy.events.roadmap = copy.events.roadmap.filter((r) => r.id !== deletingConfirm.id);
    }
    const ok = await onSave(copy);
    if (ok) setDeletingConfirm(null);
  };

  return (
    <div className="roadmap-admin">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Annual Activity Roadmap Editions</h2>
          <p style={{ margin: "0.25rem 0 0", color: "#61596a", fontSize: "0.9rem" }}>
            Manage the multi-calendar switcher cards, themes, timelines, and milestone highlights.
          </p>
        </div>
        <button
          type="button"
          className="tp-btn"
          onClick={openCreate}
          style={{ minWidth: "180px", whiteSpace: "nowrap" }}
        >
          + Add New Roadmap Edition
        </button>
      </div>

      {/* Toolbar */}
      <div className="tp-filter-bar">
        <input
          type="text"
          className="tp-search-input"
          placeholder="🔍 Search roadmaps by title, edition label, theme, or timeline..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          aria-label="Search roadmap editions"
        />
        {searchQuery.trim() !== "" && (
          <button
            type="button"
            className="tp-btn tp-btn-ghost"
            onClick={() => {
              setSearchQuery("");
              setPage(1);
            }}
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Table Meta */}
      <div className="tp-table-meta">
        <div>
          Showing <strong>{filteredRoadmaps.length === 0 ? 0 : (safePage - 1) * pageSize + 1}</strong>–
          <strong>{Math.min(safePage * pageSize, filteredRoadmaps.length)}</strong> of{" "}
          <strong>{filteredRoadmaps.length}</strong> editions
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label htmlFor="rm-pagesize" style={{ fontSize: "0.88rem" }}>Rows per page:</label>
          <select
            id="rm-pagesize"
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

      {/* Data Table */}
      {filteredRoadmaps.length === 0 ? (
        <div className="tp-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: "#61596a", margin: 0 }}>No roadmap editions found.</p>
        </div>
      ) : (
        <div className="tp-table-wrap">
          <table className="tp-table">
            <thead>
              <tr>
                <th style={{ minWidth: "150px" }}>Edition Label</th>
                <th style={{ minWidth: "220px" }}>Main Title</th>
                <th style={{ minWidth: "160px" }}>Theme</th>
                <th style={{ minWidth: "150px" }}>Active Period</th>
                <th style={{ minWidth: "110px" }}>Milestones</th>
                <th style={{ minWidth: "140px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRoadmaps.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: "#0d716b", background: "#f0fdf4", padding: "2px 8px", borderRadius: "4px", fontSize: "0.82rem" }}>
                      {r.editionLabel}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: "#1f2937", marginBottom: "2px" }}>
                      {r.title}
                    </div>
                    {r.intro && (
                      <div style={{ fontSize: "0.82rem", color: "#6b7280", maxWidth: "320px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.intro}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 600 }}>
                      “{r.theme}”
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                      📅 {r.period}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, background: "#f3e8ff", color: "#6b21a8", padding: "2px 8px", borderRadius: "12px" }}>
                      {r.highlights?.length || 0} phases
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="tp-btn tp-btn-ghost"
                        style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.82rem" }}
                        onClick={() => openEdit(r)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="tp-btn tp-btn-ghost"
                        style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.82rem", color: "#b91c1c", borderColor: "#fca5a5" }}
                        onClick={() => setDeletingConfirm({ id: r.id, title: r.title, editionLabel: r.editionLabel })}
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

      {/* EDIT / CREATE MODAL */}
      {editingEdition && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1rem", overflowY: "auto" }}>
          <div style={{ background: "#fff", borderRadius: "10px", maxWidth: "820px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "1.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, color: "#0d716b" }}>
                {editingEdition.isNew ? "Add New Roadmap Edition" : `Edit Edition: ${editingEdition.values.editionLabel}`}
              </h3>
              <button
                type="button"
                className="tp-btn tp-btn-ghost"
                onClick={() => setEditingEdition(null)}
                style={{ minHeight: "32px", padding: "2px 8px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Edition Label * (Pill on switcher)
                </label>
                <input
                  type="text"
                  value={editingEdition.values.editionLabel}
                  onChange={(e) =>
                    setEditingEdition({
                      ...editingEdition,
                      values: { ...editingEdition.values, editionLabel: e.target.value },
                    })
                  }
                  placeholder="e.g. 2026 (1st Half)"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: errors.editionLabel ? "1px solid #dc2626" : "1px solid #ccc" }}
                />
                {errors.editionLabel && <div style={{ color: "#dc2626", fontSize: "0.78rem", marginTop: "2px" }}>{errors.editionLabel}</div>}
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Full Headline Title *
                </label>
                <input
                  type="text"
                  value={editingEdition.values.title}
                  onChange={(e) =>
                    setEditingEdition({
                      ...editingEdition,
                      values: { ...editingEdition.values, title: e.target.value },
                    })
                  }
                  placeholder="e.g. 1st Half Yearly Activity Calendar: &quot;Finding The Missing Pieces&quot;"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: errors.title ? "1px solid #dc2626" : "1px solid #ccc" }}
                />
                {errors.title && <div style={{ color: "#dc2626", fontSize: "0.78rem", marginTop: "2px" }}>{errors.title}</div>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Core Theme
                </label>
                <input
                  type="text"
                  value={editingEdition.values.theme || ""}
                  onChange={(e) =>
                    setEditingEdition({
                      ...editingEdition,
                      values: { ...editingEdition.values, theme: e.target.value },
                    })
                  }
                  placeholder="e.g. Finding The Missing Pieces"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Active Period / Timeline
                </label>
                <input
                  type="text"
                  value={editingEdition.values.period || ""}
                  onChange={(e) =>
                    setEditingEdition({
                      ...editingEdition,
                      values: { ...editingEdition.values, period: e.target.value },
                    })
                  }
                  placeholder="e.g. January 2026 – June 2026"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Introduction Description
              </label>
              <textarea
                rows={2}
                value={editingEdition.values.intro || ""}
                onChange={(e) =>
                  setEditingEdition({
                    ...editingEdition,
                    values: { ...editingEdition.values, intro: e.target.value },
                  })
                }
                placeholder="Official calendar published by Rotary Club of Bintulu Central..."
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <UploadField
                kind="poster"
                label="Full Calendar Poster Image"
                value={editingEdition.values.image || editingEdition.values.poster}
                onChange={(url) =>
                  setEditingEdition({
                    ...editingEdition,
                    values: { ...editingEdition.values, image: url, poster: url },
                  })
                }
              />
            </div>

            {/* Milestones / Highlights Sub-Editor */}
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h4 style={{ margin: 0, color: "#1f2937", fontSize: "0.95rem" }}>
                  Key Roadmap Milestone Highlights ({editingEdition.values.highlights?.length || 0})
                </h4>
                <button
                  type="button"
                  className="tp-btn tp-btn-ghost"
                  onClick={handleAddHighlight}
                  style={{ minHeight: "30px", padding: "2px 8px", fontSize: "0.82rem" }}
                >
                  + Add Milestone
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {editingEdition.values.highlights?.map((hl, hIdx) => (
                  <div key={hIdx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.75rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr auto", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                      <input
                        type="text"
                        placeholder="Num"
                        value={hl.num}
                        onChange={(e) => handleHighlightChange(hIdx, "num", e.target.value)}
                        style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid #ccc", fontWeight: 700 }}
                      />
                      <input
                        type="text"
                        placeholder="Phase (e.g. Phase 1)"
                        value={hl.phase}
                        onChange={(e) => handleHighlightChange(hIdx, "phase", e.target.value)}
                        style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid #ccc" }}
                      />
                      <input
                        type="text"
                        placeholder="Tag (e.g. Outreach)"
                        value={hl.tag}
                        onChange={(e) => handleHighlightChange(hIdx, "tag", e.target.value)}
                        style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid #ccc" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(hIdx)}
                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "1.1rem" }}
                        title="Remove highlight"
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <input
                        type="text"
                        placeholder="Milestone Title"
                        value={hl.title}
                        onChange={(e) => handleHighlightChange(hIdx, "title", e.target.value)}
                        style={{ width: "100%", padding: "0.4rem", borderRadius: "4px", border: "1px solid #ccc", fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <textarea
                        rows={2}
                        placeholder="Milestone Description"
                        value={hl.desc}
                        onChange={(e) => handleHighlightChange(hIdx, "desc", e.target.value)}
                        style={{ width: "100%", padding: "0.4rem", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.85rem" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid #e5e7eb", paddingTop: "1rem" }}>
              <button
                type="button"
                className="tp-btn tp-btn-ghost"
                onClick={() => setEditingEdition(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tp-btn"
                onClick={handleSaveModal}
              >
                {editingEdition.isNew ? "Create Edition" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "10px", maxWidth: "480px", width: "100%", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 0.5rem", color: "#991b1b" }}>Confirm Edition Deletion</h3>
            <p style={{ margin: "0 0 1rem", color: "#4b5563", fontSize: "0.95rem" }}>
              Are you sure you want to delete <strong>{deletingConfirm.editionLabel} — {deletingConfirm.title}</strong>? This edition will be removed from the interactive roadmap switcher.
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
                Yes, Delete Edition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
