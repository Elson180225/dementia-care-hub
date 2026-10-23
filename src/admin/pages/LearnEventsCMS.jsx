import { useEffect, useState } from "react";
import { api } from "../../trainer-portal/TrainerContext";
import Activities from "../../trainer-portal/pages/Activities";
import defaultContent from "../../../shared/learn-events-content.json";
import OnlineEducationAdmin from "./learn-events/OnlineEducationAdmin";
import PhysicalEducationAdmin from "./learn-events/PhysicalEducationAdmin";
import RoadmapAdmin from "./learn-events/RoadmapAdmin";
import OutreachNewsAdmin from "./learn-events/OutreachNewsAdmin";
import CertifiedTrainersAdmin from "./learn-events/CertifiedTrainersAdmin";
import "../../trainer-portal/TrainerPortal.css";

export default function LearnEventsCMS() {
  const [activeTab, setActiveTab] = useState("sessions"); // sessions | online | physical | roadmap | outreach | trainers
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

  async function handleSave(newContent) {
    const dataToSave = newContent || content;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await api("/api/admin/learn-events-content", dataToSave);
      if (newContent) setContent(newContent);
      setMessage("All Learn & Events content saved successfully. Changes are now live on the website!");
      return true;
    } catch (err) {
      setError(err.message || "Failed to save content. Please try again.");
      return false;
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
            Manage scheduled live sessions, online webinars, physical programmes, roadmap timelines, media stories, and certified trainers.
          </p>
        </div>
        {activeTab !== "sessions" && (
          <button
            type="button"
            className="tp-btn"
            disabled={saving}
            onClick={() => handleSave()}
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
          Events &amp; Workshop
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
          Annual Roadmap
        </button>
        <button
          type="button"
          className={activeTab === "outreach" ? "active" : ""}
          onClick={() => setActiveTab("outreach")}
          style={{ cursor: "pointer", background: "none", border: "none", padding: "0.6rem 1rem", borderBottom: activeTab === "outreach" ? "2px solid #0d716b" : "none", fontWeight: activeTab === "outreach" ? "700" : "500", color: activeTab === "outreach" ? "#0d716b" : "#4b5563" }}
        >
          Outreach &amp; News
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

      {/* TAB 1: EVENTS & WORKSHOP */}
      {activeTab === "sessions" && (
        <div>
          <div style={{ background: "#f8fafc", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>📅 Events &amp; Workshop Hub</h3>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569" }}>
              Create, update, and manage all project activities, community workshops, dialogues, and online sessions. Published activities immediately reflect across the public <strong>Explore Community Events &amp; Workshops</strong> directory and <strong>Upcoming Calendar</strong>.
            </p>
          </div>
          <Activities admin={true} />
        </div>
      )}

      {/* TAB 2: ONLINE EDUCATION */}
      {activeTab === "online" && (
        <div>
          <div style={{ background: "#f8fafc", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>💻 Online Education Management</h3>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569" }}>
              Manage upcoming online webinars, preview cards, and permanent Q&amp;A learning resources with full CRUD operations, keyword search, and pagination.
            </p>
          </div>
          <OnlineEducationAdmin content={content} onSave={handleSave} />
        </div>
      )}

      {/* TAB 3: PHYSICAL EDUCATION */}
      {activeTab === "physical" && (
        <div>
          <div style={{ background: "#f8fafc", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>🏋️ Physical Education Management</h3>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569" }}>
              Configure in-person DCS tracks, target roles, syllabus pillars, and scheduled intakes with full CRUD operations, keyword search, and pagination.
            </p>
          </div>
          <PhysicalEducationAdmin content={content} onSave={handleSave} />
        </div>
      )}

      {/* TAB 4: ANNUAL ROADMAP */}
      {activeTab === "roadmap" && (
        <div>
          <div style={{ background: "#f8fafc", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>🗺️ Annual Activity Roadmap Management</h3>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569" }}>
              Manage multi-edition roadmaps, milestone stepper tracks, and high-resolution calendar posters with full CRUD operations.
            </p>
          </div>
          <RoadmapAdmin content={content} onSave={handleSave} />
        </div>
      )}

      {/* TAB 5: OUTREACH & NEWS */}
      {activeTab === "outreach" && (
        <div>
          <div style={{ background: "#f8fafc", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>🗣️ Community Outreach &amp; Press News</h3>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569" }}>
              Manage community dialogue photo stories and regional press clipping articles with full CRUD operations, search, and pagination.
            </p>
          </div>
          <OutreachNewsAdmin content={content} onSave={handleSave} />
        </div>
      )}

      {/* TAB 6: CERTIFIED TRAINERS & GOVERNANCE */}
      {activeTab === "trainers" && (
        <div>
          <div style={{ background: "#f8fafc", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>👨‍⚕️ Certified Trainers &amp; Governance Directory</h3>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569" }}>
              Manage clinical facilitators and advisory specialists displayed on the public carousel and directory with search, category filters, and CRUD modals.
            </p>
          </div>
          <CertifiedTrainersAdmin content={content} onSave={handleSave} />
        </div>
      )}
    </div>
  );
}
