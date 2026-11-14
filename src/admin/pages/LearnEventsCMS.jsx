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
        </div>
        {!["sessions","online","physical","roadmap","outreach","trainers"].includes(activeTab) && (
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
          style={{ cursor: "pointer", background: "none", border: "none", padding: "0.6rem 1rem", borderBottom: activeTab === "sessions" ? "2px solid var(--color-purple-600)" : "none", fontWeight: activeTab === "sessions" ? "700" : "500", color: activeTab === "sessions" ? "var(--color-purple-600)" : "var(--color-neutral-600)" }}
        >
          Events &amp; Workshop
        </button>
        <button
          type="button"
          className={activeTab === "online" ? "active" : ""}
          onClick={() => setActiveTab("online")}
          style={{ cursor: "pointer", background: "none", border: "none", padding: "0.6rem 1rem", borderBottom: activeTab === "online" ? "2px solid var(--color-purple-600)" : "none", fontWeight: activeTab === "online" ? "700" : "500", color: activeTab === "online" ? "var(--color-purple-600)" : "var(--color-neutral-600)" }}
        >
          Online Education
        </button>
        <button
          type="button"
          className={activeTab === "physical" ? "active" : ""}
          onClick={() => setActiveTab("physical")}
          style={{ cursor: "pointer", background: "none", border: "none", padding: "0.6rem 1rem", borderBottom: activeTab === "physical" ? "2px solid var(--color-purple-600)" : "none", fontWeight: activeTab === "physical" ? "700" : "500", color: activeTab === "physical" ? "var(--color-purple-600)" : "var(--color-neutral-600)" }}
        >
          Physical Education
        </button>
        <button
          type="button"
          className={activeTab === "roadmap" ? "active" : ""}
          onClick={() => setActiveTab("roadmap")}
          style={{ cursor: "pointer", background: "none", border: "none", padding: "0.6rem 1rem", borderBottom: activeTab === "roadmap" ? "2px solid var(--color-purple-600)" : "none", fontWeight: activeTab === "roadmap" ? "700" : "500", color: activeTab === "roadmap" ? "var(--color-purple-600)" : "var(--color-neutral-600)" }}
        >
          Annual Roadmap
        </button>
        <button
          type="button"
          className={activeTab === "outreach" ? "active" : ""}
          onClick={() => setActiveTab("outreach")}
          style={{ cursor: "pointer", background: "none", border: "none", padding: "0.6rem 1rem", borderBottom: activeTab === "outreach" ? "2px solid var(--color-purple-600)" : "none", fontWeight: activeTab === "outreach" ? "700" : "500", color: activeTab === "outreach" ? "var(--color-purple-600)" : "var(--color-neutral-600)" }}
        >
          Outreach &amp; News
        </button>
        <button
          type="button"
          className={activeTab === "trainers" ? "active" : ""}
          onClick={() => setActiveTab("trainers")}
          style={{ cursor: "pointer", background: "none", border: "none", padding: "0.6rem 1rem", borderBottom: activeTab === "trainers" ? "2px solid var(--color-purple-600)" : "none", fontWeight: activeTab === "trainers" ? "700" : "500", color: activeTab === "trainers" ? "var(--color-purple-600)" : "var(--color-neutral-600)" }}
        >
          Certified Trainers &amp; Governance
        </button>
      </nav>

      {activeTab === "sessions" && <Activities admin={true} />}
      {activeTab === "online" && <OnlineEducationAdmin content={content} onSave={handleSave} />}
      {activeTab === "physical" && <PhysicalEducationAdmin content={content} onSave={handleSave} />}
      {activeTab === "roadmap" && <RoadmapAdmin content={content} onSave={handleSave} />}
      {activeTab === "outreach" && <OutreachNewsAdmin content={content} onSave={handleSave} />}
      {activeTab === "trainers" && <CertifiedTrainersAdmin content={content} onSave={handleSave} />}
    </div>
  );
}
