import { useEffect, useState } from "react";
import {useLocation} from 'react-router-dom';
import { api } from "../../trainer-portal/TrainerContext";
import Activities from "../../trainer-portal/pages/Activities";
import OnlineEducationAdmin from "./learn-events/OnlineEducationAdmin";
import PhysicalEducationAdmin from "./learn-events/PhysicalEducationAdmin";
import RoadmapAdmin from "./learn-events/RoadmapAdmin";
import OutreachNewsAdmin from "./learn-events/OutreachNewsAdmin";
import CertifiedTrainersAdmin from "./learn-events/CertifiedTrainersAdmin";
import WebinarLibrary from './WebinarLibrary';
import "../../trainer-portal/TrainerPortal.css";

export default function LearnEventsCMS() {
  const {search}=useLocation();
  const [activeTab, setActiveTab] = useState(()=>new URLSearchParams(search).get('section')==='library'?'library':'sessions');
  useEffect(()=>{if(new URLSearchParams(search).get('section')==='library')setActiveTab('library');},[search]);
  const [content, setContent] = useState(null);
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
        if(active)setError(err.message || "Unable to load Learn & Events content.");
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
      const result=await api("/api/admin/learn-events-content", dataToSave);
      setContent(result.content);
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

  if(!content)return <div className="tp-card" role="alert"><h2>Unable to load Learn &amp; Events</h2><p>{error}</p><button className="tp-btn" onClick={()=>window.location.reload()}>Try again</button></div>;
  return (
    <div className="learn-events-cms-admin">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Education &amp; Events Management</h1>
          <p>Manage programme information and dated activities. Publication review, registrations, training records and completion are separate decisions.</p>
        </div>
        {!["sessions","online","physical","roadmap","outreach","trainers","library"].includes(activeTab) && (
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


      <nav className="tp-nav tp-section-nav" aria-label="Education and Events sections">
        {[
          ["library", "Publication & webinar library"],
          ["sessions", "Events & workshops"],
          ["online", "Online Education"],
          ["physical", "Physical Education"],
          ["roadmap", "Annual Roadmap"],
          ["outreach", "Outreach & News"],
          ["trainers", "Certified Trainers & Governance"],
        ].map(([section, label]) => (
          <button key={section} type="button" aria-pressed={section === activeTab}
            onClick={() => setActiveTab(section)}>{label}</button>
        ))}
      </nav>

      {activeTab === "sessions" && <Activities admin={true} />}
      {activeTab === 'library' && <WebinarLibrary />}
      {activeTab === "online" && <OnlineEducationAdmin content={content} onSave={handleSave} />}
      {activeTab === "physical" && <PhysicalEducationAdmin content={content} onSave={handleSave} />}
      {activeTab === "roadmap" && <RoadmapAdmin content={content} onSave={handleSave} />}
      {activeTab === "outreach" && <OutreachNewsAdmin content={content} onSave={handleSave} />}
      {activeTab === "trainers" && <CertifiedTrainersAdmin content={content} onSave={handleSave} />}
    </div>
  );
}
