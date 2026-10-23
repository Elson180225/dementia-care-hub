import { useState, useMemo } from "react";
import UploadField from "../../../trainer-portal/UploadField";

const BLANK_TRAINER = {
  id: "",
  name: "",
  role: "Medical Officer / Dementia Trainer",
  institution: "Sarawak General Hospital, Kuching",
  city: "Kuching",
  language: "English / Bahasa Melayu",
  category: "medical-professional",
  bio: "",
  avatarUrl: "",
  badgeColor: "#0d716b",
  initials: "DR",
};

export default function CertifiedTrainersAdmin({ content, onSave }) {
  const [editingTrainer, setEditingTrainer] = useState(null); // null or { values, isNew }
  const [deletingConfirm, setDeletingConfirm] = useState(null);
  const [errors, setErrors] = useState({});

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const trainers = content?.certifiedTrainers?.trainersList || [];

  // Computed cities for filter
  const allCities = useMemo(() => {
    const set = new Set();
    trainers.forEach((t) => {
      if (t.city?.trim()) set.add(t.city.trim());
    });
    return [...set].sort();
  }, [trainers]);

  // Filtered trainers
  const filteredTrainers = useMemo(() => {
    return trainers.filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (cityFilter !== "all" && t.city !== cityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          t.name?.toLowerCase().includes(q) ||
          t.role?.toLowerCase().includes(q) ||
          t.institution?.toLowerCase().includes(q) ||
          t.city?.toLowerCase().includes(q) ||
          t.bio?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [trainers, categoryFilter, cityFilter, searchQuery]);

  const totalPages = Math.ceil(filteredTrainers.length / pageSize) || 1;
  const safePage = Math.min(page, totalPages);
  const pagedTrainers = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredTrainers.slice(start, start + pageSize);
  }, [filteredTrainers, safePage, pageSize]);

  // Open Edit
  const openEdit = (tr) => {
    setErrors({});
    setEditingTrainer({
      isNew: false,
      values: JSON.parse(JSON.stringify(tr)),
    });
  };

  // Open Create
  const openCreate = () => {
    setErrors({});
    setEditingTrainer({
      isNew: true,
      values: {
        ...BLANK_TRAINER,
        id: `trainer-${Date.now()}`,
      },
    });
  };

  // Compute initials automatically if empty
  const handleNameChange = (name) => {
    const parts = name.trim().split(" ").filter(Boolean);
    const inits = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
    setEditingTrainer({
      ...editingTrainer,
      values: {
        ...editingTrainer.values,
        name,
        initials: editingTrainer.values.initials && !editingTrainer.isNew ? editingTrainer.values.initials : inits || "TR",
      },
    });
  };

  // Save Modal
  const handleSaveModal = async () => {
    const v = editingTrainer.values;
    const errs = {};
    if (!v.name?.trim()) errs.name = "Please enter trainer full name.";
    if (!v.role?.trim()) errs.role = "Please enter designation or specialty.";
    if (!v.institution?.trim()) errs.institution = "Please enter affiliated hospital or institution.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const copy = JSON.parse(JSON.stringify(content));
    if (!copy.certifiedTrainers) copy.certifiedTrainers = {};
    if (!Array.isArray(copy.certifiedTrainers.trainersList)) copy.certifiedTrainers.trainersList = [];

    if (editingTrainer.isNew) {
      copy.certifiedTrainers.trainersList.push(v);
    } else {
      const idx = copy.certifiedTrainers.trainersList.findIndex((t) => t.id === v.id);
      if (idx >= 0) copy.certifiedTrainers.trainersList[idx] = v;
      else copy.certifiedTrainers.trainersList.push(v);
    }

    const ok = await onSave(copy);
    if (ok) setEditingTrainer(null);
  };

  // Delete
  const handleDeleteConfirm = async () => {
    if (!deletingConfirm) return;
    const copy = JSON.parse(JSON.stringify(content));
    if (copy.certifiedTrainers?.trainersList) {
      copy.certifiedTrainers.trainersList = copy.certifiedTrainers.trainersList.filter(
        (t) => t.id !== deletingConfirm.id
      );
    }
    const ok = await onSave(copy);
    if (ok) setDeletingConfirm(null);
  };

  return (
    <div className="certified-trainers-admin">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Certified Trainers &amp; Governance Directory</h2>
          <p style={{ margin: "0.25rem 0 0", color: "#61596a", fontSize: "0.9rem" }}>
            Manage doctors, healthcare educators, and advisory board profiles displayed on the continuous carousel and public directory.
          </p>
        </div>
        <button
          type="button"
          className="tp-btn"
          onClick={openCreate}
          style={{ minWidth: "180px", whiteSpace: "nowrap" }}
        >
          + Add New Facilitator
        </button>
      </div>

      {/* Toolbar */}
      <div className="tp-filter-bar">
        <input
          type="text"
          className="tp-search-input"
          placeholder="🔍 Search trainers by name, hospital, role, bio..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          aria-label="Search trainers"
        />

        <select
          className="tp-select-filter"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          <option value="medical-professional">Clinical Frontline (Doctors / Professionals)</option>
          <option value="advisory-support">Clinical Governance (Advisory Specialists)</option>
        </select>

        {allCities.length > 0 && (
          <select
            className="tp-select-filter"
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
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

        {(searchQuery.trim() !== "" || categoryFilter !== "all" || cityFilter !== "all") && (
          <button
            type="button"
            className="tp-btn tp-btn-ghost"
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
              setCityFilter("all");
              setPage(1);
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Table Meta */}
      <div className="tp-table-meta">
        <div>
          Showing <strong>{filteredTrainers.length === 0 ? 0 : (safePage - 1) * pageSize + 1}</strong>–
          <strong>{Math.min(safePage * pageSize, filteredTrainers.length)}</strong> of{" "}
          <strong>{filteredTrainers.length}</strong> trainers
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label htmlFor="ct-pagesize" style={{ fontSize: "0.88rem" }}>Rows per page:</label>
          <select
            id="ct-pagesize"
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
      {filteredTrainers.length === 0 ? (
        <div className="tp-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: "#61596a", margin: 0 }}>No trainers match your search criteria.</p>
        </div>
      ) : (
        <div className="tp-table-wrap">
          <table className="tp-table">
            <thead>
              <tr>
                <th style={{ minWidth: "80px" }}>Avatar</th>
                <th style={{ minWidth: "220px" }}>Trainer Name &amp; Title</th>
                <th style={{ minWidth: "180px" }}>Specialty / Role</th>
                <th style={{ minWidth: "160px" }}>Category</th>
                <th style={{ minWidth: "200px" }}>Affiliation &amp; City</th>
                <th style={{ minWidth: "140px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedTrainers.map((tr) => (
                <tr key={tr.id}>
                  <td>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: tr.badgeColor || "#0d716b",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        overflow: "hidden",
                      }}
                    >
                      {tr.avatarUrl ? (
                        <img src={tr.avatarUrl} alt={tr.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        tr.initials || "TR"
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: "#1f2937", marginBottom: "2px" }}>
                      {tr.name}
                    </div>
                    {tr.language && (
                      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                        🌐 {tr.language}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: "0.88rem", color: "#374151", fontWeight: 600 }}>
                      {tr.role}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "12px",
                        background: tr.category === "medical-professional" ? "#ecfdf5" : "#fef3c7",
                        color: tr.category === "medical-professional" ? "#047857" : "#b45309",
                        border: "1px solid",
                        borderColor: tr.category === "medical-professional" ? "#a7f3d0" : "#fde68a",
                      }}
                    >
                      {tr.category === "medical-professional" ? "Clinical Frontline" : "Clinical Governance"}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.85rem", color: "#1f2937" }}>
                      🏥 {tr.institution}
                    </div>
                    {tr.city && (
                      <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "2px" }}>
                        📍 {tr.city}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="tp-btn tp-btn-ghost"
                        style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.82rem" }}
                        onClick={() => openEdit(tr)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="tp-btn tp-btn-ghost"
                        style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.82rem", color: "#b91c1c", borderColor: "#fca5a5" }}
                        onClick={() => setDeletingConfirm({ id: tr.id, name: tr.name, role: tr.role })}
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
      {editingTrainer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1rem", overflowY: "auto" }}>
          <div style={{ background: "#fff", borderRadius: "10px", maxWidth: "720px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "1.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, color: "#0d716b" }}>
                {editingTrainer.isNew ? "Add New Certified Trainer" : `Edit Profile: ${editingTrainer.values.name}`}
              </h3>
              <button
                type="button"
                className="tp-btn tp-btn-ghost"
                onClick={() => setEditingTrainer(null)}
                style={{ minHeight: "32px", padding: "2px 8px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Full Name &amp; Title *
                </label>
                <input
                  type="text"
                  value={editingTrainer.values.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Dr. Wong Teck Shin"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: errors.name ? "1px solid #dc2626" : "1px solid #ccc" }}
                />
                {errors.name && <div style={{ color: "#dc2626", fontSize: "0.78rem", marginTop: "2px" }}>{errors.name}</div>}
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Initials / Badge
                </label>
                <input
                  type="text"
                  value={editingTrainer.values.initials || ""}
                  onChange={(e) =>
                    setEditingTrainer({
                      ...editingTrainer,
                      values: { ...editingTrainer.values, initials: e.target.value },
                    })
                  }
                  placeholder="e.g. WS"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Role / Clinical Designation *
                </label>
                <input
                  type="text"
                  value={editingTrainer.values.role}
                  onChange={(e) =>
                    setEditingTrainer({
                      ...editingTrainer,
                      values: { ...editingTrainer.values, role: e.target.value },
                    })
                  }
                  placeholder="e.g. Consultant Geriatrician"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: errors.role ? "1px solid #dc2626" : "1px solid #ccc" }}
                />
                {errors.role && <div style={{ color: "#dc2626", fontSize: "0.78rem", marginTop: "2px" }}>{errors.role}</div>}
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Governance Category
                </label>
                <select
                  value={editingTrainer.values.category}
                  onChange={(e) =>
                    setEditingTrainer({
                      ...editingTrainer,
                      values: { ...editingTrainer.values, category: e.target.value },
                    })
                  }
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                >
                  <option value="medical-professional">Clinical Frontline (Doctors &amp; Educators)</option>
                  <option value="advisory-support">Clinical Governance (Advisory Specialists)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Hospital / Institution *
                </label>
                <input
                  type="text"
                  value={editingTrainer.values.institution}
                  onChange={(e) =>
                    setEditingTrainer({
                      ...editingTrainer,
                      values: { ...editingTrainer.values, institution: e.target.value },
                    })
                  }
                  placeholder="e.g. Sarawak General Hospital, Kuching"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: errors.institution ? "1px solid #dc2626" : "1px solid #ccc" }}
                />
                {errors.institution && <div style={{ color: "#dc2626", fontSize: "0.78rem", marginTop: "2px" }}>{errors.institution}</div>}
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  City / Locality
                </label>
                <input
                  type="text"
                  value={editingTrainer.values.city || ""}
                  onChange={(e) =>
                    setEditingTrainer({
                      ...editingTrainer,
                      values: { ...editingTrainer.values, city: e.target.value },
                    })
                  }
                  placeholder="e.g. Kuching, Sibu, Miri"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Language(s) Spoken
                </label>
                <input
                  type="text"
                  value={editingTrainer.values.language || ""}
                  onChange={(e) =>
                    setEditingTrainer({
                      ...editingTrainer,
                      values: { ...editingTrainer.values, language: e.target.value },
                    })
                  }
                  placeholder="e.g. English / Bahasa Melayu / 中文"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                  Card Accent Color
                </label>
                <input
                  type="text"
                  value={editingTrainer.values.badgeColor || "#0d716b"}
                  onChange={(e) =>
                    setEditingTrainer({
                      ...editingTrainer,
                      values: { ...editingTrainer.values, badgeColor: e.target.value },
                    })
                  }
                  placeholder="e.g. #0d716b"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Background &amp; Clinical Bio
              </label>
              <textarea
                rows={3}
                value={editingTrainer.values.bio || ""}
                onChange={(e) =>
                  setEditingTrainer({
                    ...editingTrainer,
                    values: { ...editingTrainer.values, bio: e.target.value },
                  })
                }
                placeholder="Senior consultant geriatrician leading dementia clinical assessments..."
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <UploadField
                kind="photo"
                label="Profile Picture / Avatar"
                value={editingTrainer.values.avatarUrl}
                onChange={(url) =>
                  setEditingTrainer({
                    ...editingTrainer,
                    values: { ...editingTrainer.values, avatarUrl: url },
                  })
                }
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid #e5e7eb", paddingTop: "1rem" }}>
              <button
                type="button"
                className="tp-btn tp-btn-ghost"
                onClick={() => setEditingTrainer(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tp-btn"
                onClick={handleSaveModal}
              >
                {editingTrainer.isNew ? "Create Profile" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "10px", maxWidth: "480px", width: "100%", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 0.5rem", color: "#991b1b" }}>Confirm Trainer Deletion</h3>
            <p style={{ margin: "0 0 1rem", color: "#4b5563", fontSize: "0.95rem" }}>
              Are you sure you want to delete <strong>{deletingConfirm.name} ({deletingConfirm.role})</strong>? This profile will no longer appear on the public clinical carousel or directory.
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
                Yes, Delete Trainer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
