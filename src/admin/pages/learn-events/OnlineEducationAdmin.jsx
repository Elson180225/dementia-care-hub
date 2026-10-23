import { useState, useMemo } from "react";
import Activities from "../../../trainer-portal/pages/Activities";
import UploadField from "../../../trainer-portal/UploadField";

const BLANK_TOPIC = {
  id: "",
  title: "",
  month: "APR",
  day: "11",
  year: "2026",
  date: "11 Apr 2026",
  time: "80 minutes",
  mode: "Online",
  location: "Online",
  language: "English / Bahasa Melayu",
  speaker: "RCBC & ADFM Specialists",
  suitableFor: "General public, families and caregivers",
  description: "",
  image: "",
};

const BLANK_RESOURCE = {
  id: "",
  title: "",
  type: "Q&A Document",
  language: "English",
  duration: "4 pages",
  year: "2026",
  description: "",
  videoUrl: "",
  qaFolder: "",
};

export default function OnlineEducationAdmin({ content, onSave }) {
  // Sub-tabs: "webinars" | "topics" | "resources" | "headers"
  const [subSection, setSubSection] = useState("webinars");
  const [editingTopic, setEditingTopic] = useState(null); // null or { values, isNew }
  const [editingResource, setEditingResource] = useState(null); // null or { values, isNew }
  const [deletingConfirm, setDeletingConfirm] = useState(null); // { type: 'topic'|'resource', id, title }
  const [topicErrors, setTopicErrors] = useState({});
  const [resourceErrors, setResourceErrors] = useState({});

  // Headers editing state
  const initialHeaders = content?.onlineEducation?.sectionHeader || {};
  const [headersState, setHeadersState] = useState(initialHeaders);
  const [headerSaving, setHeaderSaving] = useState(false);

  // Filter & Search states for Topics
  const [topicSearch, setTopicSearch] = useState("");
  const [topicModeFilter, setTopicModeFilter] = useState("all");
  const [topicPage, setTopicPage] = useState(1);
  const [topicPageSize, setTopicPageSize] = useState(10);

  // Filter & Search states for Resources
  const [resSearch, setResSearch] = useState("");
  const [resYearFilter, setResYearFilter] = useState("all");
  const [resPage, setResPage] = useState(1);
  const [resPageSize, setResPageSize] = useState(10);

  // Safe data access
  const topics = content?.onlineEducation?.upcomingTopics || [];
  const resources = content?.onlineEducation?.approvedResources || [];

  // Filtered Topics
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      if (topicModeFilter !== "all" && t.mode !== topicModeFilter) return false;
      if (topicSearch.trim()) {
        const q = topicSearch.toLowerCase().trim();
        const match =
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.speaker?.toLowerCase().includes(q) ||
          t.location?.toLowerCase().includes(q) ||
          t.language?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [topics, topicModeFilter, topicSearch]);

  const totalTopicPages = Math.ceil(filteredTopics.length / topicPageSize) || 1;
  const safeTopicPage = Math.min(topicPage, totalTopicPages);
  const pagedTopics = useMemo(() => {
    const start = (safeTopicPage - 1) * topicPageSize;
    return filteredTopics.slice(start, start + topicPageSize);
  }, [filteredTopics, safeTopicPage, topicPageSize]);

  // Filtered Resources
  const allResYears = useMemo(() => {
    const set = new Set();
    resources.forEach((r) => {
      if (r.year) set.add(String(r.year));
    });
    return [...set].sort().reverse();
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (resYearFilter !== "all" && String(r.year) !== resYearFilter) return false;
      if (resSearch.trim()) {
        const q = resSearch.toLowerCase().trim();
        const match =
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.language?.toLowerCase().includes(q) ||
          r.type?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [resources, resYearFilter, resSearch]);

  const totalResPages = Math.ceil(filteredResources.length / resPageSize) || 1;
  const safeResPage = Math.min(resPage, totalResPages);
  const pagedResources = useMemo(() => {
    const start = (safeResPage - 1) * resPageSize;
    return filteredResources.slice(start, start + resPageSize);
  }, [filteredResources, safeResPage, resPageSize]);

  // TOPIC VALIDATION & CRUD
  function validateTopic(v) {
    const errs = {};
    if (!v.title?.trim()) errs.title = "Title is required.";
    if (!v.month?.trim()) errs.month = "Month code (e.g. APR) is required.";
    if (!v.day?.trim()) errs.day = "Day (e.g. 11) is required.";
    if (!v.date?.trim()) errs.date = "Full date string is required.";
    if (!v.description?.trim()) errs.description = "Description is required.";
    return errs;
  }

  async function handleSaveTopic() {
    const errs = validateTopic(editingTopic.values);
    setTopicErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const copy = JSON.parse(JSON.stringify(content));
    const currentTopics = copy.onlineEducation?.upcomingTopics || [];
    const topicVal = { ...editingTopic.values };

    if (editingTopic.isNew) {
      if (!topicVal.id) topicVal.id = `topic-${Date.now()}`;
      currentTopics.push(topicVal);
    } else {
      const idx = currentTopics.findIndex((t) => String(t.id) === String(topicVal.id));
      if (idx !== -1) {
        currentTopics[idx] = topicVal;
      } else {
        currentTopics.push(topicVal);
      }
    }

    copy.onlineEducation.upcomingTopics = currentTopics;
    const ok = await onSave(copy);
    if (ok) setEditingTopic(null);
  }

  async function handleDeleteTopic(id) {
    const copy = JSON.parse(JSON.stringify(content));
    copy.onlineEducation.upcomingTopics = (copy.onlineEducation?.upcomingTopics || []).filter(
      (t) => String(t.id) !== String(id)
    );
    await onSave(copy);
    setDeletingConfirm(null);
  }

  // RESOURCE VALIDATION & CRUD
  function validateResource(v) {
    const errs = {};
    if (!v.title?.trim()) errs.title = "Title is required.";
    if (!v.type?.trim()) errs.type = "Resource type is required.";
    if (!v.year || isNaN(Number(v.year))) errs.year = "Valid 4-digit year is required.";
    if (!v.description?.trim()) errs.description = "Description is required.";
    return errs;
  }

  async function handleSaveResource() {
    const errs = validateResource(editingResource.values);
    setResourceErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const copy = JSON.parse(JSON.stringify(content));
    const currentResources = copy.onlineEducation?.approvedResources || [];
    const resVal = { ...editingResource.values };

    if (editingResource.isNew) {
      if (!resVal.id) resVal.id = Date.now();
      currentResources.push(resVal);
    } else {
      const idx = currentResources.findIndex((r) => String(r.id) === String(resVal.id));
      if (idx !== -1) {
        currentResources[idx] = resVal;
      } else {
        currentResources.push(resVal);
      }
    }

    copy.onlineEducation.approvedResources = currentResources;
    const ok = await onSave(copy);
    if (ok) setEditingResource(null);
  }

  async function handleDeleteResource(id) {
    const copy = JSON.parse(JSON.stringify(content));
    copy.onlineEducation.approvedResources = (copy.onlineEducation?.approvedResources || []).filter(
      (r) => String(r.id) !== String(id)
    );
    await onSave(copy);
    setDeletingConfirm(null);
  }

  // HEADERS SAVE
  async function handleSaveHeaders() {
    setHeaderSaving(true);
    const copy = JSON.parse(JSON.stringify(content));
    if (!copy.onlineEducation) copy.onlineEducation = {};
    copy.onlineEducation.sectionHeader = headersState;
    await onSave(copy);
    setHeaderSaving(false);
  }

  // ==========================================
  // RENDER: EDITING TOPIC VIEW
  // ==========================================
  if (editingTopic) {
    const v = editingTopic.values;
    return (
      <div className="online-topic-edit-view">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ margin: 0, color: "#45206d" }}>
              {editingTopic.isNew ? "➕ New Upcoming Webinar / Topic" : `✏️ Edit Topic: ${v.title || "Untitled"}`}
            </h2>
            <p style={{ margin: "0.25rem 0 0", color: "#61596a", fontSize: "0.95rem" }}>
              Configure details for the "Looking Ahead" webinar preview card on the public website.
            </p>
          </div>
          <button
            type="button"
            className="tp-btn tp-btn-ghost"
            onClick={() => {
              setEditingTopic(null);
              setTopicErrors({});
            }}
          >
            ← Back to Topics Listing
          </button>
        </div>

        <div className="tp-card">
          <div className="tp-field">
            <label htmlFor="topic-title">
              Topic / Webinar Title <span style={{ color: "#a12121" }}>*</span>
            </label>
            <input
              id="topic-title"
              type="text"
              value={v.title}
              placeholder="e.g. Webinar – Season 1 (Alzheimer's Care Project)"
              aria-invalid={Boolean(topicErrors.title)}
              onChange={(e) => setEditingTopic({ ...editingTopic, values: { ...v, title: e.target.value } })}
            />
            {topicErrors.title && <small className="tp-error">{topicErrors.title}</small>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
            <div className="tp-field">
              <label htmlFor="topic-month">
                Badge Month <span style={{ color: "#a12121" }}>*</span>
              </label>
              <input
                id="topic-month"
                type="text"
                placeholder="e.g. APR, MAY"
                value={v.month}
                aria-invalid={Boolean(topicErrors.month)}
                onChange={(e) => setEditingTopic({ ...editingTopic, values: { ...v, month: e.target.value.toUpperCase() } })}
              />
              {topicErrors.month && <small className="tp-error">{topicErrors.month}</small>}
            </div>

            <div className="tp-field">
              <label htmlFor="topic-day">
                Badge Day <span style={{ color: "#a12121" }}>*</span>
              </label>
              <input
                id="topic-day"
                type="text"
                placeholder="e.g. 11, 16"
                value={v.day}
                aria-invalid={Boolean(topicErrors.day)}
                onChange={(e) => setEditingTopic({ ...editingTopic, values: { ...v, day: e.target.value } })}
              />
              {topicErrors.day && <small className="tp-error">{topicErrors.day}</small>}
            </div>

            <div className="tp-field">
              <label htmlFor="topic-year">Year</label>
              <input
                id="topic-year"
                type="text"
                placeholder="e.g. 2026"
                value={v.year || ""}
                onChange={(e) => setEditingTopic({ ...editingTopic, values: { ...v, year: e.target.value } })}
              />
            </div>

            <div className="tp-field">
              <label htmlFor="topic-time">Time / Duration</label>
              <input
                id="topic-time"
                type="text"
                placeholder="e.g. 80 minutes or 9:00 AM – 6:00 PM"
                value={v.time}
                onChange={(e) => setEditingTopic({ ...editingTopic, values: { ...v, time: e.target.value } })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="tp-field">
              <label htmlFor="topic-date">
                Full Display Date <span style={{ color: "#a12121" }}>*</span>
              </label>
              <input
                id="topic-date"
                type="text"
                placeholder="e.g. 11 Apr 2026"
                value={v.date}
                aria-invalid={Boolean(topicErrors.date)}
                onChange={(e) => setEditingTopic({ ...editingTopic, values: { ...v, date: e.target.value } })}
              />
              {topicErrors.date && <small className="tp-error">{topicErrors.date}</small>}
            </div>

            <div className="tp-field">
              <label htmlFor="topic-mode">Mode</label>
              <select
                id="topic-mode"
                value={v.mode}
                onChange={(e) => {
                  const m = e.target.value;
                  setEditingTopic({
                    ...editingTopic,
                    values: { ...v, mode: m, location: m === "Online" ? "Online" : (v.location === "Online" ? "" : v.location) },
                  });
                }}
              >
                <option value="Online">Online</option>
                <option value="Physical">Physical</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="tp-field">
              <label htmlFor="topic-location">Location / Venue</label>
              <input
                id="topic-location"
                type="text"
                placeholder="e.g. Online or Hock Lee Hotel, Kuching"
                value={v.location}
                onChange={(e) => setEditingTopic({ ...editingTopic, values: { ...v, location: e.target.value } })}
              />
            </div>

            <div className="tp-field">
              <label htmlFor="topic-language">Language</label>
              <input
                id="topic-language"
                type="text"
                placeholder="e.g. English / Bahasa Melayu / 中文"
                value={v.language}
                onChange={(e) => setEditingTopic({ ...editingTopic, values: { ...v, language: e.target.value } })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="tp-field">
              <label htmlFor="topic-speaker">Speakers / Facilitators</label>
              <input
                id="topic-speaker"
                type="text"
                placeholder="e.g. RCBC & ADFM Specialists"
                value={v.speaker}
                onChange={(e) => setEditingTopic({ ...editingTopic, values: { ...v, speaker: e.target.value } })}
              />
            </div>

            <div className="tp-field">
              <label htmlFor="topic-suitable">Suitable for (Audience)</label>
              <input
                id="topic-suitable"
                type="text"
                placeholder="e.g. General public, families and caregivers"
                value={v.suitableFor}
                onChange={(e) => setEditingTopic({ ...editingTopic, values: { ...v, suitableFor: e.target.value } })}
              />
            </div>
          </div>

          <div className="tp-field">
            <label htmlFor="topic-description">
              Description <span style={{ color: "#a12121" }}>*</span>
            </label>
            <textarea
              id="topic-description"
              rows={4}
              value={v.description}
              placeholder="Outline the session highlights, purpose, and key takeaways..."
              aria-invalid={Boolean(topicErrors.description)}
              onChange={(e) => setEditingTopic({ ...editingTopic, values: { ...v, description: e.target.value } })}
            />
            {topicErrors.description && <small className="tp-error">{topicErrors.description}</small>}
          </div>

          <div className="tp-field">
            <label>Event Poster / Featured Image</label>
            <input
              type="text"
              placeholder="Image URL or local path (e.g. /src/assets/education/webinar-learning.jpg)"
              value={v.image || ""}
              style={{ marginBottom: "0.5rem" }}
              onChange={(e) => setEditingTopic({ ...editingTopic, values: { ...v, image: e.target.value } })}
            />
            <UploadField
              kind="poster"
              label="Upload poster / image"
              value={v.image}
              onChange={(url) => setEditingTopic({ ...editingTopic, values: { ...v, image: url } })}
            />
          </div>

          <div className="tp-actions" style={{ marginTop: "1.5rem" }}>
            <button type="button" className="tp-btn" onClick={handleSaveTopic}>
              💾 Save Topic
            </button>
            <button
              type="button"
              className="tp-btn tp-btn-ghost"
              onClick={() => {
                setEditingTopic(null);
                setTopicErrors({});
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: EDITING RESOURCE VIEW
  // ==========================================
  if (editingResource) {
    const v = editingResource.values;
    return (
      <div className="online-resource-edit-view">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ margin: 0, color: "#45206d" }}>
              {editingResource.isNew ? "➕ New Approved Learning Resource" : `✏️ Edit Resource: ${v.title || "Untitled"}`}
            </h2>
            <p style={{ margin: "0.25rem 0 0", color: "#61596a", fontSize: "0.95rem" }}>
              Configure permanent educational recording, video link, and Q&amp;A document viewer data.
            </p>
          </div>
          <button
            type="button"
            className="tp-btn tp-btn-ghost"
            onClick={() => {
              setEditingResource(null);
              setResourceErrors({});
            }}
          >
            ← Back to Resources Listing
          </button>
        </div>

        <div className="tp-card">
          <div className="tp-field">
            <label htmlFor="res-title">
              Resource Title <span style={{ color: "#a12121" }}>*</span>
            </label>
            <input
              id="res-title"
              type="text"
              value={v.title}
              placeholder="e.g. Understanding the Missing Pieces — Q&A Collection"
              aria-invalid={Boolean(resourceErrors.title)}
              onChange={(e) => setEditingResource({ ...editingResource, values: { ...v, title: e.target.value } })}
            />
            {resourceErrors.title && <small className="tp-error">{resourceErrors.title}</small>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <div className="tp-field">
              <label htmlFor="res-type">
                Type / Format <span style={{ color: "#a12121" }}>*</span>
              </label>
              <input
                id="res-type"
                type="text"
                placeholder="e.g. Q&A Document (4 Pages) or Webinar Video"
                value={v.type}
                aria-invalid={Boolean(resourceErrors.type)}
                onChange={(e) => setEditingResource({ ...editingResource, values: { ...v, type: e.target.value } })}
              />
              {resourceErrors.type && <small className="tp-error">{resourceErrors.type}</small>}
            </div>

            <div className="tp-field">
              <label htmlFor="res-year">
                Year <span style={{ color: "#a12121" }}>*</span>
              </label>
              <input
                id="res-year"
                type="text"
                placeholder="e.g. 2025, 2026"
                value={v.year}
                aria-invalid={Boolean(resourceErrors.year)}
                onChange={(e) => setEditingResource({ ...editingResource, values: { ...v, year: e.target.value } })}
              />
              {resourceErrors.year && <small className="tp-error">{resourceErrors.year}</small>}
            </div>

            <div className="tp-field">
              <label htmlFor="res-lang">Language</label>
              <input
                id="res-lang"
                type="text"
                placeholder="e.g. English, 中文, Bahasa Malaysia"
                value={v.language}
                onChange={(e) => setEditingResource({ ...editingResource, values: { ...v, language: e.target.value } })}
              />
            </div>

            <div className="tp-field">
              <label htmlFor="res-duration">Duration / Extent</label>
              <input
                id="res-duration"
                type="text"
                placeholder="e.g. 4 pages or 45 mins"
                value={v.duration || ""}
                onChange={(e) => setEditingResource({ ...editingResource, values: { ...v, duration: e.target.value } })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="tp-field">
              <label htmlFor="res-video">Watch Recording Video Link (URL)</label>
              <input
                id="res-video"
                type="url"
                placeholder="https://facebook.com/... or https://youtube.com/..."
                value={v.videoUrl || ""}
                onChange={(e) => setEditingResource({ ...editingResource, values: { ...v, videoUrl: e.target.value } })}
              />
              <small>Clicking "Watch recording ↗" on the website will open this direct URL.</small>
            </div>

            <div className="tp-field">
              <label htmlFor="res-qafolder">Q&amp;A Document Folder / Key</label>
              <input
                id="res-qafolder"
                type="text"
                placeholder="e.g. Understanding the Missing Pieces"
                value={v.qaFolder || ""}
                onChange={(e) => setEditingResource({ ...editingResource, values: { ...v, qaFolder: e.target.value } })}
              />
              <small>Matches folder name in Q&amp;A viewer modal.</small>
            </div>
          </div>

          <div className="tp-field">
            <label htmlFor="res-description">
              Description <span style={{ color: "#a12121" }}>*</span>
            </label>
            <textarea
              id="res-description"
              rows={3}
              value={v.description}
              placeholder="Summary of topics covered, questions answered, and core lessons..."
              aria-invalid={Boolean(resourceErrors.description)}
              onChange={(e) => setEditingResource({ ...editingResource, values: { ...v, description: e.target.value } })}
            />
            {resourceErrors.description && <small className="tp-error">{resourceErrors.description}</small>}
          </div>

          <div className="tp-actions" style={{ marginTop: "1.5rem" }}>
            <button type="button" className="tp-btn" onClick={handleSaveResource}>
              💾 Save Resource
            </button>
            <button
              type="button"
              className="tp-btn tp-btn-ghost"
              onClick={() => {
                setEditingResource(null);
                setResourceErrors({});
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN VIEW (WITH 4 SUB-TABS)
  // ==========================================
  return (
    <div className="online-education-admin-module">
      {/* Sub-section Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "6px", background: "#f3e8ff", padding: "4px", borderRadius: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setSubSection("webinars")}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: subSection === "webinars" ? 700 : 500,
              background: subSection === "webinars" ? "#51277d" : "transparent",
              color: subSection === "webinars" ? "#fff" : "#51277d",
              transition: "all 0.15s ease",
            }}
          >
            🎥 Public Education Webinars
          </button>
          <button
            type="button"
            onClick={() => setSubSection("topics")}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: subSection === "topics" ? 700 : 500,
              background: subSection === "topics" ? "#51277d" : "transparent",
              color: subSection === "topics" ? "#fff" : "#51277d",
              transition: "all 0.15s ease",
            }}
          >
            📅 Upcoming Topics &amp; Previews ({topics.length})
          </button>
          <button
            type="button"
            onClick={() => setSubSection("resources")}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: subSection === "resources" ? 700 : 500,
              background: subSection === "resources" ? "#51277d" : "transparent",
              color: subSection === "resources" ? "#fff" : "#51277d",
              transition: "all 0.15s ease",
            }}
          >
            📚 Approved Learning Resources ({resources.length})
          </button>
          <button
            type="button"
            onClick={() => setSubSection("headers")}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: subSection === "headers" ? 700 : 500,
              background: subSection === "headers" ? "#51277d" : "transparent",
              color: subSection === "headers" ? "#fff" : "#51277d",
              transition: "all 0.15s ease",
            }}
          >
            ⚙️ Section Headers
          </button>
        </div>

        <div>
          {subSection === "topics" && (
            <button
              type="button"
              className="tp-btn"
              onClick={() => {
                setEditingTopic({ values: { ...BLANK_TOPIC, id: `topic-${Date.now()}` }, isNew: true });
                setTopicErrors({});
              }}
            >
              + New Upcoming Topic
            </button>
          )}
          {subSection === "resources" && (
            <button
              type="button"
              className="tp-btn"
              onClick={() => {
                setEditingResource({ values: { ...BLANK_RESOURCE, id: Date.now() }, isNew: true });
                setResourceErrors({});
              }}
            >
              + New Learning Resource
            </button>
          )}
        </div>
      </div>

      {/* SUB-SECTION 1: LIVE PUBLIC WEBINARS (Interconnected with Activities Engine) */}
      {subSection === "webinars" && (
        <div>
          <Activities
            admin={true}
            initialFilterMode="Online"
            defaultValues={{
              mode: "Online",
              venue: "Online",
              city: "Online",
              type: "RCBC Webinar",
            }}
            pageTitle="Previous & Future Public Education Webinars"
            pageSubtitle="Scheduled public education webinars (RCBC Webinar and CT Webinar series). When published, records appear immediately under 'Previous & future public education webinars' on the public website."
            newButtonLabel="+ New Public Webinar"
          />
        </div>
      )}

      {/* Delete Confirmation Modal for Topics and Resources */}
      {deletingConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div className="tp-card" style={{ maxWidth: "480px", width: "100%", margin: 0, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 0.75rem", color: "#991b1b" }}>⚠️ Confirm Deletion</h3>
            <p style={{ color: "#374151", margin: "0 0 1.25rem" }}>
              Are you sure you want to delete <strong>"{deletingConfirm.title}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
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
                style={{ background: "#dc2626", borderColor: "#dc2626" }}
                onClick={() => {
                  if (deletingConfirm.type === "topic") handleDeleteTopic(deletingConfirm.id);
                  else handleDeleteResource(deletingConfirm.id);
                }}
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: UPCOMING TOPICS & PREVIEWS */}
      {subSection === "topics" && (
        <div>
          {/* Stats Cards */}
          <div className="tp-stats">
            <div className="tp-stat">
              <span>Total Scheduled Topics</span>
              <strong>{topics.length}</strong>
            </div>
            <div className="tp-stat">
              <span>Online Sessions</span>
              <strong style={{ color: "#0284c7" }}>
                {topics.filter((t) => t.mode === "Online").length}
              </strong>
            </div>
            <div className="tp-stat">
              <span>Physical Workshops</span>
              <strong style={{ color: "#16a34a" }}>
                {topics.filter((t) => t.mode === "Physical").length}
              </strong>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="tp-filter-bar">
            <input
              type="text"
              className="tp-search-input"
              placeholder="🔍 Search topics by title, speaker, description, language..."
              value={topicSearch}
              onChange={(e) => {
                setTopicSearch(e.target.value);
                setTopicPage(1);
              }}
              aria-label="Search online topics"
            />
            <select
              className="tp-select-filter"
              value={topicModeFilter}
              onChange={(e) => {
                setTopicModeFilter(e.target.value);
                setTopicPage(1);
              }}
              aria-label="Filter by mode"
            >
              <option value="all">All Modes</option>
              <option value="Online">Online</option>
              <option value="Physical">Physical</option>
            </select>
          </div>

          {/* Table Meta */}
          <div className="tp-table-meta">
            <span>
              Showing {filteredTopics.length === 0 ? 0 : (safeTopicPage - 1) * topicPageSize + 1}–
              {Math.min(safeTopicPage * topicPageSize, filteredTopics.length)} of {filteredTopics.length} topics
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label htmlFor="topic-page-size" style={{ fontSize: "0.9rem" }}>Per page:</label>
              <select
                id="topic-page-size"
                className="tp-select-filter"
                style={{ minHeight: "32px", padding: "4px 8px" }}
                value={topicPageSize}
                onChange={(e) => {
                  setTopicPageSize(Number(e.target.value));
                  setTopicPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredTopics.length === 0 ? (
            <div className="tp-card" style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <p style={{ margin: 0, color: "#61596a", fontSize: "1.05rem" }}>
                No topics found matching your search.
              </p>
              {topicSearch && (
                <button
                  type="button"
                  className="tp-btn tp-btn-ghost"
                  style={{ marginTop: "1rem" }}
                  onClick={() => {
                    setTopicSearch("");
                    setTopicModeFilter("all");
                  }}
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
                    <th style={{ width: "80px" }}>Date</th>
                    <th style={{ minWidth: "240px" }}>Title &amp; Topic Details</th>
                    <th style={{ minWidth: "140px" }}>Mode &amp; Location</th>
                    <th style={{ minWidth: "160px" }}>Language &amp; Speaker</th>
                    <th style={{ minWidth: "130px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedTopics.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ textAlign: "center", background: "#f3e8ff", border: "1px solid #d8b4fe", borderRadius: "8px", padding: "4px 6px" }}>
                          <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#7e22ce" }}>{t.month}</span>
                          <strong style={{ display: "block", fontSize: "1.2rem", color: "#45206d", lineHeight: 1.1 }}>{t.day}</strong>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#1f2937", marginBottom: "4px" }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#61596a", marginBottom: "4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {t.description}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#4b5563" }}>
                          ⏱️ {t.time} • 🎯 {t.suitableFor}
                        </div>
                      </td>
                      <td>
                        <span className={`tp-badge-mode ${t.mode === "Online" ? "tp-badge-online" : "tp-badge-physical"}`}>
                          {t.mode}
                        </span>
                        <div style={{ fontSize: "0.82rem", color: "#4b5563", marginTop: "4px" }}>
                          📍 {t.location}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
                          🗣️ {t.language}
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: "3px" }}>
                          👤 {t.speaker}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className="tp-btn tp-btn-ghost"
                          style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.85rem", marginRight: "6px" }}
                          onClick={() => {
                            setEditingTopic({ values: { ...t }, isNew: false });
                            setTopicErrors({});
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          className="tp-btn tp-btn-ghost"
                          style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.85rem", color: "#b91c1c", borderColor: "#fca5a5" }}
                          onClick={() => setDeletingConfirm({ type: "topic", id: t.id, title: t.title })}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalTopicPages > 1 && (
            <div className="tp-pagination">
              <button
                type="button"
                className="tp-page-btn"
                disabled={safeTopicPage <= 1}
                onClick={() => setTopicPage((p) => Math.max(1, p - 1))}
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalTopicPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`tp-page-btn ${p === safeTopicPage ? "active" : ""}`}
                  onClick={() => setTopicPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="tp-page-btn"
                disabled={safeTopicPage >= totalTopicPages}
                onClick={() => setTopicPage((p) => Math.min(totalTopicPages, p + 1))}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-SECTION 3: APPROVED LEARNING RESOURCES */}
      {subSection === "resources" && (
        <div>
          {/* Stats Cards */}
          <div className="tp-stats">
            <div className="tp-stat">
              <span>Total Learning Resources</span>
              <strong>{resources.length}</strong>
            </div>
            <div className="tp-stat">
              <span>With Video Recording Link</span>
              <strong style={{ color: "#0284c7" }}>
                {resources.filter((r) => Boolean(r.videoUrl)).length}
              </strong>
            </div>
            <div className="tp-stat">
              <span>Available Years</span>
              <strong style={{ color: "#7e22ce" }}>
                {allResYears.join(", ") || "—"}
              </strong>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="tp-filter-bar">
            <input
              type="text"
              className="tp-search-input"
              placeholder="🔍 Search resources by title, description, language, type..."
              value={resSearch}
              onChange={(e) => {
                setResSearch(e.target.value);
                setResPage(1);
              }}
              aria-label="Search resources"
            />
            <select
              className="tp-select-filter"
              value={resYearFilter}
              onChange={(e) => {
                setResYearFilter(e.target.value);
                setResPage(1);
              }}
              aria-label="Filter by year"
            >
              <option value="all">All Years</option>
              {allResYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Table Meta */}
          <div className="tp-table-meta">
            <span>
              Showing {filteredResources.length === 0 ? 0 : (safeResPage - 1) * resPageSize + 1}–
              {Math.min(safeResPage * resPageSize, filteredResources.length)} of {filteredResources.length} resources
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label htmlFor="res-page-size" style={{ fontSize: "0.9rem" }}>Per page:</label>
              <select
                id="res-page-size"
                className="tp-select-filter"
                style={{ minHeight: "32px", padding: "4px 8px" }}
                value={resPageSize}
                onChange={(e) => {
                  setResPageSize(Number(e.target.value));
                  setResPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredResources.length === 0 ? (
            <div className="tp-card" style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <p style={{ margin: 0, color: "#61596a", fontSize: "1.05rem" }}>
                No learning resources found matching your search.
              </p>
              {resSearch && (
                <button
                  type="button"
                  className="tp-btn tp-btn-ghost"
                  style={{ marginTop: "1rem" }}
                  onClick={() => {
                    setResSearch("");
                    setResYearFilter("all");
                  }}
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
                    <th style={{ width: "90px" }}>Year</th>
                    <th style={{ minWidth: "260px" }}>Resource Title &amp; Overview</th>
                    <th style={{ minWidth: "150px" }}>Format &amp; Extent</th>
                    <th style={{ minWidth: "160px" }}>Video / Direct Link</th>
                    <th style={{ minWidth: "130px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedResources.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, background: "#f1f5f9", color: "#334155", padding: "3px 8px", borderRadius: "6px" }}>
                          {r.year}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#1f2937", marginBottom: "4px" }}>
                          {r.title}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#61596a", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {r.description}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0d716b" }}>
                          📄 {r.type}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "3px" }}>
                          🗣️ {r.language} {r.duration ? `• ⏳ ${r.duration}` : ""}
                        </div>
                      </td>
                      <td>
                        {r.videoUrl ? (
                          <a
                            href={r.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "0.85rem", color: "#0284c7", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            Watch Recording ↗
                          </a>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>No video link</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className="tp-btn tp-btn-ghost"
                          style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.85rem", marginRight: "6px" }}
                          onClick={() => {
                            setEditingResource({ values: { ...r }, isNew: false });
                            setResourceErrors({});
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          className="tp-btn tp-btn-ghost"
                          style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.85rem", color: "#b91c1c", borderColor: "#fca5a5" }}
                          onClick={() => setDeletingConfirm({ type: "resource", id: r.id, title: r.title })}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalResPages > 1 && (
            <div className="tp-pagination">
              <button
                type="button"
                className="tp-page-btn"
                disabled={safeResPage <= 1}
                onClick={() => setResPage((p) => Math.max(1, p - 1))}
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalResPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`tp-page-btn ${p === safeResPage ? "active" : ""}`}
                  onClick={() => setResPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="tp-page-btn"
                disabled={safeResPage >= totalResPages}
                onClick={() => setResPage((p) => Math.min(totalResPages, p + 1))}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-SECTION 4: SECTION HEADERS & DESCRIPTIONS */}
      {subSection === "headers" && (
        <div className="tp-card">
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ margin: 0, color: "#45206d" }}>⚙️ Online Education Section Titles &amp; Intros</h2>
            <p style={{ margin: "0.25rem 0 0", color: "#61596a", fontSize: "0.95rem" }}>
              Customize the section labels, headlines, and introductory paragraphs displayed on the public website's Online Education page.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* RCBC Webinars Section */}
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem" }}>
              <h3 style={{ margin: "0 0 0.75rem", color: "#0d716b", fontSize: "1.05rem" }}>
                1. RCBC Public Webinar Series (Previous &amp; Future Public Education Webinars)
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "0.75rem" }}>
                <div className="tp-field" style={{ margin: 0 }}>
                  <label htmlFor="h-rcbc-label">Badge Label</label>
                  <input
                    id="h-rcbc-label"
                    type="text"
                    value={headersState.rcbcLabel || ""}
                    placeholder="e.g. RCBC annual webinar series"
                    onChange={(e) => setHeadersState({ ...headersState, rcbcLabel: e.target.value })}
                  />
                </div>
                <div className="tp-field" style={{ margin: 0 }}>
                  <label htmlFor="h-rcbc-title">Main Headline Title</label>
                  <input
                    id="h-rcbc-title"
                    type="text"
                    value={headersState.rcbcTitle || ""}
                    placeholder="e.g. Previous & future public education webinars"
                    onChange={(e) => setHeadersState({ ...headersState, rcbcTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="tp-field" style={{ margin: 0 }}>
                <label htmlFor="h-rcbc-desc">Section Description</label>
                <textarea
                  id="h-rcbc-desc"
                  rows={2}
                  value={headersState.rcbcDesc || ""}
                  placeholder="Introductory text describing the annual RCBC public webinars..."
                  onChange={(e) => setHeadersState({ ...headersState, rcbcDesc: e.target.value })}
                />
              </div>
            </div>

            {/* Certified Trainer Webinars Section */}
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem" }}>
              <h3 style={{ margin: "0 0 0.75rem", color: "#0d716b", fontSize: "1.05rem" }}>
                2. Certified Trainer Webinars Series
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "0.75rem" }}>
                <div className="tp-field" style={{ margin: 0 }}>
                  <label htmlFor="h-ct-label">Badge Label</label>
                  <input
                    id="h-ct-label"
                    type="text"
                    value={headersState.ctLabel || ""}
                    placeholder="e.g. Certified Trainer webinar"
                    onChange={(e) => setHeadersState({ ...headersState, ctLabel: e.target.value })}
                  />
                </div>
                <div className="tp-field" style={{ margin: 0 }}>
                  <label htmlFor="h-ct-title">Main Headline Title</label>
                  <input
                    id="h-ct-title"
                    type="text"
                    value={headersState.ctTitle || ""}
                    placeholder="e.g. Webinars hosted by ADFM certified trainers"
                    onChange={(e) => setHeadersState({ ...headersState, ctTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="tp-field" style={{ margin: 0 }}>
                <label htmlFor="h-ct-desc">Section Description</label>
                <textarea
                  id="h-ct-desc"
                  rows={2}
                  value={headersState.ctDesc || ""}
                  placeholder="Introductory text describing webinars led by certified trainers..."
                  onChange={(e) => setHeadersState({ ...headersState, ctDesc: e.target.value })}
                />
              </div>
            </div>

            {/* Looking Ahead Section */}
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem" }}>
              <h3 style={{ margin: "0 0 0.75rem", color: "#0d716b", fontSize: "1.05rem" }}>
                3. Looking Ahead (Upcoming Events &amp; Topics)
              </h3>
              <div className="tp-field" style={{ margin: "0 0 0.75rem" }}>
                <label htmlFor="h-up-title">Headline Title</label>
                <input
                  id="h-up-title"
                  type="text"
                  value={headersState.upcomingTitle || ""}
                  placeholder="e.g. Upcoming Events & Topics"
                  onChange={(e) => setHeadersState({ ...headersState, upcomingTitle: e.target.value })}
                />
              </div>
              <div className="tp-field" style={{ margin: 0 }}>
                <label htmlFor="h-up-desc">Section Description</label>
                <textarea
                  id="h-up-desc"
                  rows={2}
                  value={headersState.upcomingDesc || ""}
                  placeholder="Introductory text describing preview topics..."
                  onChange={(e) => setHeadersState({ ...headersState, upcomingDesc: e.target.value })}
                />
              </div>
            </div>

            {/* Approved Learning Resources Section */}
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem" }}>
              <h3 style={{ margin: "0 0 0.75rem", color: "#0d716b", fontSize: "1.05rem" }}>
                4. Approved Learning Resources (Recordings &amp; Q&amp;A Viewer)
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "0.75rem" }}>
                <div className="tp-field" style={{ margin: 0 }}>
                  <label htmlFor="h-app-label">Badge Label</label>
                  <input
                    id="h-app-label"
                    type="text"
                    value={headersState.approvedLabel || ""}
                    placeholder="e.g. Learning resources"
                    onChange={(e) => setHeadersState({ ...headersState, approvedLabel: e.target.value })}
                  />
                </div>
                <div className="tp-field" style={{ margin: 0 }}>
                  <label htmlFor="h-app-title">Main Headline Title</label>
                  <input
                    id="h-app-title"
                    type="text"
                    value={headersState.approvedTitle || ""}
                    placeholder="e.g. Recordings, videos, Q&A and approved materials"
                    onChange={(e) => setHeadersState({ ...headersState, approvedTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="tp-field" style={{ margin: 0 }}>
                <label htmlFor="h-app-desc">Section Description</label>
                <textarea
                  id="h-app-desc"
                  rows={2}
                  value={headersState.approvedDesc || ""}
                  placeholder="Introductory text describing permanent learning resources and Q&A archives..."
                  onChange={(e) => setHeadersState({ ...headersState, approvedDesc: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="tp-actions" style={{ marginTop: "1.75rem" }}>
            <button
              type="button"
              className="tp-btn"
              disabled={headerSaving}
              onClick={handleSaveHeaders}
            >
              {headerSaving ? "Saving..." : "💾 Save Section Headers"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
