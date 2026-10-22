import { useEffect, useState } from "react";
import { api } from "../../trainer-portal/TrainerContext";
import UploadField from "../../trainer-portal/UploadField";
import Activities from "../../trainer-portal/pages/Activities";
import defaultContent from "../../../shared/learn-events-content.json";
import "../../trainer-portal/TrainerPortal.css";

export default function LearnEventsCMS() {
  const [activeTab, setActiveTab] = useState("sessions"); // sessions | online | physical | roadmap | trainers
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load latest content on mount
  useEffect(() => {
    let active = true;
    api("/api/admin/learn-events-content")
      .then((data) => {
        if (active && data && typeof data === "object" && Object.keys(data).length > 0) {
          setContent(data);
        }
      })
      .catch((err) => {
        console.warn("Using default Learn & Events content:", err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await api("/api/admin/learn-events-content", content);
      setMessage("All Learn & Events content saved successfully. Changes are now live on the website!");
    } catch (err) {
      setError(err.message || "Failed to save content. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="tp-card">
        <p>Loading Learn &amp; Events management...</p>
      </div>
    );
  }

  return (
    <div className="learn-events-cms-admin">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Learn &amp; Events Management</h1>
          <p style={{ margin: "0.25rem 0 0", color: "#666" }}>
            Manage scheduled live sessions, online webinar records, physical programmes, and media highlights.
          </p>
        </div>
        {activeTab !== "sessions" && (
          <button
            type="button"
            className="tp-btn"
            disabled={saving}
            onClick={handleSave}
            style={{ minWidth: "160px" }}
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        )}
      </div>

      {message && (
        <div style={{ padding: "0.85rem 1.25rem", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", color: "#065f46", marginBottom: "1.25rem" }}>
          <strong>Success:</strong> {message}
        </div>
      )}

      {error && (
        <div style={{ padding: "0.85rem 1.25rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b", marginBottom: "1.25rem" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Sub-navigation tabs */}
      <nav className="tp-nav" aria-label="Learn and Events sub-navigation" style={{ marginBottom: "1.5rem" }}>
        <button
          type="button"
          className={activeTab === "sessions" ? "active" : ""}
          onClick={() => setActiveTab("sessions")}
          style={{ cursor: "pointer", background: "none", border: "none", padding: "0.6rem 1rem", borderBottom: activeTab === "sessions" ? "2px solid #0d716b" : "none", fontWeight: activeTab === "sessions" ? "700" : "500", color: activeTab === "sessions" ? "#0d716b" : "#4b5563" }}
        >
          Scheduled Sessions &amp; Calendar
        </button>
        <button
          type="button"
          className={activeTab === "online" ? "active" : ""}
          onClick={() => setActiveTab("online")}
          style={{ cursor: "pointer", background: "none", border: "none", padding: "0.6rem 1rem", borderBottom: activeTab === "online" ? "2px solid #0d716b" : "none", fontWeight: activeTab === "online" ? "700" : "500", color: activeTab === "online" ? "#0d716b" : "#4b5563" }}
        >
          Online Education
        </button>
        <button
          type="button"
          className={activeTab === "physical" ? "active" : ""}
          onClick={() => setActiveTab("physical")}
          style={{ cursor: "pointer", background: "none", border: "none", padding: "0.6rem 1rem", borderBottom: activeTab === "physical" ? "2px solid #0d716b" : "none", fontWeight: activeTab === "physical" ? "700" : "500", color: activeTab === "physical" ? "#0d716b" : "#4b5563" }}
        >
          Physical Education
        </button>
        <button
          type="button"
          className={activeTab === "roadmap" ? "active" : ""}
          onClick={() => setActiveTab("roadmap")}
          style={{ cursor: "pointer", background: "none", border: "none", padding: "0.6rem 1rem", borderBottom: activeTab === "roadmap" ? "2px solid #0d716b" : "none", fontWeight: activeTab === "roadmap" ? "700" : "500", color: activeTab === "roadmap" ? "#0d716b" : "#4b5563" }}
        >
          Roadmap, Outreach &amp; News
        </button>
        <button
          type="button"
          className={activeTab === "trainers" ? "active" : ""}
          onClick={() => setActiveTab("trainers")}
          style={{ cursor: "pointer", background: "none", border: "none", padding: "0.6rem 1rem", borderBottom: activeTab === "trainers" ? "2px solid #0d716b" : "none", fontWeight: activeTab === "trainers" ? "700" : "500", color: activeTab === "trainers" ? "#0d716b" : "#4b5563" }}
        >
          Certified Trainers &amp; Governance
        </button>
      </nav>

      {/* TAB 1: SCHEDULED SESSIONS & CALENDAR */}
      {activeTab === "sessions" && (
        <div>
          <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>📅 Live Activities &amp; Interactive Calendar</h3>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569" }}>
              Every activity published here immediately feeds into the public <strong>Upcoming Calendar</strong> and <strong>Explore Community Events &amp; Workshops</strong> directory with full filter support.
            </p>
          </div>
          <Activities admin={true} />
        </div>
      )}

      {/* TAB 2: ONLINE EDUCATION */}
      {activeTab === "online" && (
        <div className="tp-card" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <section>
            <h2>Upcoming Events &amp; Topics</h2>
            <p style={{ color: "#666" }}>Preview cards shown in the "Looking Ahead" section of Online Education.</p>
            {content.onlineEducation?.upcomingTopics?.map((topic, idx) => (
              <div key={topic.id || idx} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.25rem", marginBottom: "1rem", background: "#f9fafb" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Title</label>
                    <input
                      type="text"
                      value={topic.title}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                      onChange={(e) => {
                        const copy = { ...content };
                        copy.onlineEducation.upcomingTopics[idx].title = e.target.value;
                        setContent(copy);
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Date / Month Badge</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        type="text"
                        placeholder="Month (e.g. MAY)"
                        value={topic.month}
                        style={{ width: "80px", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                        onChange={(e) => {
                          const copy = { ...content };
                          copy.onlineEducation.upcomingTopics[idx].month = e.target.value;
                          setContent(copy);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Day (e.g. 16)"
                        value={topic.day}
                        style={{ width: "80px", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                        onChange={(e) => {
                          const copy = { ...content };
                          copy.onlineEducation.upcomingTopics[idx].day = e.target.value;
                          setContent(copy);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Time (e.g. 9:00 AM – 6:00 PM)"
                        value={topic.time}
                        style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                        onChange={(e) => {
                          const copy = { ...content };
                          copy.onlineEducation.upcomingTopics[idx].time = e.target.value;
                          setContent(copy);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Language</label>
                    <input
                      type="text"
                      value={topic.language}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                      onChange={(e) => {
                        const copy = { ...content };
                        copy.onlineEducation.upcomingTopics[idx].language = e.target.value;
                        setContent(copy);
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Location / Mode</label>
                    <input
                      type="text"
                      value={topic.location}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                      onChange={(e) => {
                        const copy = { ...content };
                        copy.onlineEducation.upcomingTopics[idx].location = e.target.value;
                        setContent(copy);
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Description</label>
                  <textarea
                    rows={2}
                    value={topic.description}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.onlineEducation.upcomingTopics[idx].description = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Event Poster / Image</label>
                  <input
                    type="text"
                    placeholder="Image URL or local asset path"
                    value={topic.image || ""}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", marginBottom: "0.5rem" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.onlineEducation.upcomingTopics[idx].image = e.target.value;
                      setContent(copy);
                    }}
                  />
                  <UploadField
                    kind="poster"
                    label="Or upload a new image"
                    value={topic.image}
                    onChange={(url) => {
                      const copy = { ...content };
                      copy.onlineEducation.upcomingTopics[idx].image = url;
                      setContent(copy);
                    }}
                  />
                </div>
              </div>
            ))}
          </section>

          <section>
            <h2>Approved Learning Resources (Watch Recording &amp; Q&amp;A)</h2>
            <p style={{ color: "#666" }}>
              Permanent learning resources. Each card features <strong>Watch recording ↗</strong> (direct external video URL) and <strong>Review Q&amp;A →</strong> (modal Q&amp;A viewer).
            </p>
            {content.onlineEducation?.approvedResources?.map((res, idx) => (
              <div key={res.id || idx} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.25rem", marginBottom: "1rem", background: "#f9fafb" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Resource Title</label>
                    <input
                      type="text"
                      value={res.title}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                      onChange={(e) => {
                        const copy = { ...content };
                        copy.onlineEducation.approvedResources[idx].title = e.target.value;
                        setContent(copy);
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Year</label>
                    <input
                      type="text"
                      value={res.year}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                      onChange={(e) => {
                        const copy = { ...content };
                        copy.onlineEducation.approvedResources[idx].year = e.target.value;
                        setContent(copy);
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Language</label>
                    <input
                      type="text"
                      value={res.language}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                      onChange={(e) => {
                        const copy = { ...content };
                        copy.onlineEducation.approvedResources[idx].language = e.target.value;
                        setContent(copy);
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Watch Recording Link (Video URL)</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/... or https://youtube.com/..."
                    value={res.videoUrl || ""}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.onlineEducation.approvedResources[idx].videoUrl = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Description</label>
                  <textarea
                    rows={2}
                    value={res.description}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.onlineEducation.approvedResources[idx].description = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* TAB 3: PHYSICAL EDUCATION */}
      {activeTab === "physical" && (
        <div className="tp-card" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div>
            <h2>Physical Education Programmes (DCS Tracks)</h2>
            <p style={{ color: "#666" }}>
              Configure the 3 in-person certification tracks: DCS-Family, DCS-TTT, and DCS-Care Worker.
            </p>
          </div>

          {content.physicalEducation?.programmes?.map((prog, idx) => (
            <div key={prog.id || idx} style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "1.5rem", background: "#f9fafb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, color: "#0d716b" }}>{prog.trackNumber}: {prog.code}</h3>
                <input
                  type="text"
                  placeholder="Badge (e.g. Open for Registration)"
                  value={prog.badge}
                  style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid #ccc", fontWeight: 600 }}
                  onChange={(e) => {
                    const copy = { ...content };
                    copy.physicalEducation.programmes[idx].badge = e.target.value;
                    setContent(copy);
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Programme Title</label>
                  <input
                    type="text"
                    value={prog.title}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.physicalEducation.programmes[idx].title = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Role Category / Designed For</label>
                  <input
                    type="text"
                    value={prog.roleCategory}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.physicalEducation.programmes[idx].roleCategory = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Introduction</label>
                <textarea
                  rows={2}
                  value={prog.shortIntro}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                  onChange={(e) => {
                    const copy = { ...content };
                    copy.physicalEducation.programmes[idx].shortIntro = e.target.value;
                    setContent(copy);
                  }}
                />
              </div>

              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Detailed Who This Is Designed For</label>
                <textarea
                  rows={2}
                  value={prog.suitableFor}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                  onChange={(e) => {
                    const copy = { ...content };
                    copy.physicalEducation.programmes[idx].suitableFor = e.target.value;
                    setContent(copy);
                  }}
                />
              </div>

              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Core Learning Pillars &amp; Competencies (One bullet per line)
                </label>
                <textarea
                  rows={5}
                  value={Array.isArray(prog.highlights) ? prog.highlights.join("\n") : prog.highlights || ""}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", fontFamily: "monospace" }}
                  onChange={(e) => {
                    const copy = { ...content };
                    copy.physicalEducation.programmes[idx].highlights = e.target.value.split("\n").filter(Boolean);
                    setContent(copy);
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Schedule Date</label>
                  <input
                    type="text"
                    value={prog.schedule?.date || ""}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.physicalEducation.programmes[idx].schedule = {
                        ...copy.physicalEducation.programmes[idx].schedule,
                        date: e.target.value,
                      };
                      setContent(copy);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Schedule Time / Duration</label>
                  <input
                    type="text"
                    value={prog.schedule?.time || ""}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.physicalEducation.programmes[idx].schedule = {
                        ...copy.physicalEducation.programmes[idx].schedule,
                        time: e.target.value,
                      };
                      setContent(copy);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Action Button Text</label>
                  <input
                    type="text"
                    value={prog.buttonLabel || ""}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.physicalEducation.programmes[idx].buttonLabel = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Relevant Image / Poster</label>
                <input
                  type="text"
                  placeholder="Image URL or local path"
                  value={prog.image || ""}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", marginBottom: "0.5rem" }}
                  onChange={(e) => {
                    const copy = { ...content };
                    copy.physicalEducation.programmes[idx].image = e.target.value;
                    setContent(copy);
                  }}
                />
                <UploadField
                  kind="poster"
                  label="Upload Track Image"
                  value={prog.image}
                  onChange={(url) => {
                    const copy = { ...content };
                    copy.physicalEducation.programmes[idx].image = url;
                    setContent(copy);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: ROADMAP, OUTREACH & NEWS */}
      {activeTab === "roadmap" && (
        <div className="tp-card" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Annual Roadmap */}
          <section>
            <h2>Annual Activity Roadmap (3 Phases)</h2>
            <p style={{ color: "#666" }}>
              Controls the interactive 3-card sliding roadmap carousel in the Events module.
            </p>
            {content.events?.roadmap?.map((phase, pIdx) => (
              <div key={phase.id || pIdx} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.25rem", background: "#f9fafb" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Edition / Phase Label</label>
                    <input
                      type="text"
                      value={phase.editionLabel}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                      onChange={(e) => {
                        const copy = { ...content };
                        copy.events.roadmap[pIdx].editionLabel = e.target.value;
                        setContent(copy);
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Main Title</label>
                    <input
                      type="text"
                      value={phase.title}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                      onChange={(e) => {
                        const copy = { ...content };
                        copy.events.roadmap[pIdx].title = e.target.value;
                        setContent(copy);
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Theme / Subtitle</label>
                    <input
                      type="text"
                      value={phase.theme}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                      onChange={(e) => {
                        const copy = { ...content };
                        copy.events.roadmap[pIdx].theme = e.target.value;
                        setContent(copy);
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Period / Date Range</label>
                    <input
                      type="text"
                      value={phase.period}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                      onChange={(e) => {
                        const copy = { ...content };
                        copy.events.roadmap[pIdx].period = e.target.value;
                        setContent(copy);
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Intro</label>
                  <textarea
                    rows={2}
                    value={phase.intro}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.events.roadmap[pIdx].intro = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>

                {/* Phase Highlights */}
                <div style={{ marginTop: "1rem" }}>
                  <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>3 Key Highlights</h4>
                  {phase.highlights?.map((h, hIdx) => (
                    <div key={hIdx} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 3fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <input
                        type="text"
                        placeholder="Phase (e.g. 11 April 2026)"
                        value={h.phase}
                        style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.9rem" }}
                        onChange={(e) => {
                          const copy = { ...content };
                          copy.events.roadmap[pIdx].highlights[hIdx].phase = e.target.value;
                          setContent(copy);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Highlight Title"
                        value={h.title}
                        style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.9rem" }}
                        onChange={(e) => {
                          const copy = { ...content };
                          copy.events.roadmap[pIdx].highlights[hIdx].title = e.target.value;
                          setContent(copy);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Highlight Description"
                        value={h.desc}
                        style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.9rem" }}
                        onChange={(e) => {
                          const copy = { ...content };
                          copy.events.roadmap[pIdx].highlights[hIdx].desc = e.target.value;
                          setContent(copy);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Community Outreach */}
          <section>
            <h2>Community Outreach Stories</h2>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Outreach Section Title</label>
              <input
                type="text"
                value={content.events?.communityOutreach?.mainTitle || ""}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", marginBottom: "0.75rem" }}
                onChange={(e) => {
                  const copy = { ...content };
                  copy.events.communityOutreach.mainTitle = e.target.value;
                  setContent(copy);
                }}
              />
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Section Introduction</label>
              <textarea
                rows={2}
                value={content.events?.communityOutreach?.intro || ""}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                onChange={(e) => {
                  const copy = { ...content };
                  copy.events.communityOutreach.intro = e.target.value;
                  setContent(copy);
                }}
              />
            </div>

            {content.events?.communityOutreach?.stories?.map((st, idx) => (
              <div key={st.id || idx} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem", marginBottom: "0.75rem", background: "#f9fafb" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem" }}>
                  <input
                    type="text"
                    placeholder="Story Title"
                    value={st.title}
                    style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.events.communityOutreach.stories[idx].title = e.target.value;
                      setContent(copy);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Date"
                    value={st.date}
                    style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.events.communityOutreach.stories[idx].date = e.target.value;
                      setContent(copy);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={st.location}
                    style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.events.communityOutreach.stories[idx].location = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <textarea
                    rows={2}
                    placeholder="Story description / caption"
                    value={st.description}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.events.communityOutreach.stories[idx].description = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <UploadField
                    kind="poster"
                    label="Story Photo"
                    value={st.image}
                    onChange={(url) => {
                      const copy = { ...content };
                      copy.events.communityOutreach.stories[idx].image = url;
                      setContent(copy);
                    }}
                  />
                </div>
              </div>
            ))}
          </section>

          {/* Headlines News */}
          <section>
            <h2>Sarawak Dementia Care in the Headlines</h2>
            <p style={{ color: "#666" }}>Press coverage and newspaper clipping modal items.</p>
            {content.events?.headlinesNews?.articles?.map((art, idx) => (
              <div key={art.id || idx} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem", marginBottom: "0.75rem", background: "#f9fafb" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  <input
                    type="text"
                    placeholder="Newspaper Outlet (e.g. Sin Chew Daily)"
                    value={art.outlet}
                    style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.events.headlinesNews.articles[idx].outlet = e.target.value;
                      setContent(copy);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Category / Tag"
                    value={art.category}
                    style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.events.headlinesNews.articles[idx].category = e.target.value;
                      setContent(copy);
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Date / Status"
                    value={art.date}
                    style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.events.headlinesNews.articles[idx].date = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Main Headline Title"
                    value={art.mainTitle}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.events.headlinesNews.articles[idx].mainTitle = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <textarea
                    rows={2}
                    placeholder="Article Summary Intro"
                    value={art.intro}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.events.headlinesNews.articles[idx].intro = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <UploadField
                    kind="poster"
                    label="Newspaper Clipping Image"
                    value={art.image}
                    onChange={(url) => {
                      const copy = { ...content };
                      copy.events.headlinesNews.articles[idx].image = url;
                      setContent(copy);
                    }}
                  />
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* TAB 5: CERTIFIED TRAINERS & GOVERNANCE */}
      {activeTab === "trainers" && (
        <div className="tp-card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <h2>Certified Trainers Directory (Clinical Frontline &amp; Governance)</h2>
            <p style={{ color: "#666" }}>
              Profiles appear in the Clinical Frontline continuous carousel, the Clinical Governance board, and the interactive Verified Profile modal.
            </p>
          </div>

          {content.certifiedTrainers?.trainersList?.map((tr, idx) => (
            <div key={tr.id || idx} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.25rem", background: "#f9fafb" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Trainer Name</label>
                  <input
                    type="text"
                    value={tr.name}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.certifiedTrainers.trainersList[idx].name = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Role / Designation</label>
                  <input
                    type="text"
                    value={tr.role}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.certifiedTrainers.trainersList[idx].role = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Category</label>
                  <select
                    value={tr.category}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.certifiedTrainers.trainersList[idx].category = e.target.value;
                      setContent(copy);
                    }}
                  >
                    <option value="medical-professional">Clinical Frontline (Doctor/Professional)</option>
                    <option value="advisory-support">Clinical Governance (Advisory Specialist)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Hospital / Clinic / Institution</label>
                  <input
                    type="text"
                    value={tr.institution}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.certifiedTrainers.trainersList[idx].institution = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>City</label>
                  <input
                    type="text"
                    value={tr.city}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.certifiedTrainers.trainersList[idx].city = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Language(s)</label>
                  <input
                    type="text"
                    value={tr.language}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    onChange={(e) => {
                      const copy = { ...content };
                      copy.certifiedTrainers.trainersList[idx].language = e.target.value;
                      setContent(copy);
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Background &amp; Clinical Expertise (Bio)</label>
                <textarea
                  rows={2}
                  value={tr.bio}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                  onChange={(e) => {
                    const copy = { ...content };
                    copy.certifiedTrainers.trainersList[idx].bio = e.target.value;
                    setContent(copy);
                  }}
                />
              </div>

              <div style={{ marginTop: "1rem" }}>
                <UploadField
                  kind="photo"
                  label="Profile Picture / Avatar (Optional)"
                  value={tr.avatarUrl}
                  onChange={(url) => {
                    const copy = { ...content };
                    copy.certifiedTrainers.trainersList[idx].avatarUrl = url;
                    setContent(copy);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
