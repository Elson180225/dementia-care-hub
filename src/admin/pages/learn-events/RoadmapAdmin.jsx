import { useState, useMemo } from "react";
import ContentPreviewEditor from './ContentPreviewEditor';


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
    return ok;
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

  if (editingEdition) return <ContentPreviewEditor kind="roadmap" editing={editingEdition} onChange={setEditingEdition} onSave={handleSaveModal} onClose={()=>setEditingEdition(null)} errors={errors} />;
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
