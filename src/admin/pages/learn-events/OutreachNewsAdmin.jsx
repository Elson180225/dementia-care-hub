import { useState, useMemo } from "react";
import ContentPreviewEditor from './ContentPreviewEditor';

const BLANK_STORY = {
  id: "",
  title: "",
  subtitle: "",
  date: "",
  location: "Sarawak",
  description: "",
  image: "",
};

const BLANK_PILLAR = {
  id: "",
  icon: "🌱",
  title: "",
  desc: "",
};

const BLANK_ARTICLE = {
  id: "",
  outlet: "",
  langPill: "English",
  subtitle: "Sarawak Press Coverage",
  mainTitle: "",
  intro: "",
  category: "Press Feature",
  date: "Published Feature",
  image: "",
};

export default function OutreachNewsAdmin({ content, onSave }) {
  // Sub-tabs: "outreach" | "pillars" | "news"
  const [activeSubTab, setActiveSubTab] = useState("outreach");

  // Editing modals
  const [editingStory, setEditingStory] = useState(null); // null or { values, isNew }
  const [editingPillar, setEditingPillar] = useState(null); // null or { values, isNew }
  const [editingArticle, setEditingArticle] = useState(null); // null or { values, isNew }
  const [deletingConfirm, setDeletingConfirm] = useState(null); // { type: 'story'|'pillar'|'article', id, title }
  const [errors, setErrors] = useState({});

  // Search & Filter for Stories
  const [storySearch, setStorySearch] = useState("");
  const [storyPage, setStoryPage] = useState(1);
  const [storyPageSize, setStoryPageSize] = useState(10);

  // Search & Filter for Pillars
  const [pillarSearch, setPillarSearch] = useState("");
  const [pillarPage, setPillarPage] = useState(1);
  const [pillarPageSize, setPillarPageSize] = useState(10);

  // Search & Filter for News
  const [newsSearch, setNewsSearch] = useState("");
  const [newsPage, setNewsPage] = useState(1);
  const [newsPageSize, setNewsPageSize] = useState(10);

  // Safe data extraction
  const stories = content?.events?.communityOutreach?.stories || [];
  const pillars = content?.events?.communityOutreach?.pillars || [];
  const articles = content?.events?.headlinesNews?.articles || [];

  // Filtered stories
  const filteredStories = useMemo(() => {
    return stories.filter((s) => {
      if (storySearch.trim()) {
        const q = storySearch.toLowerCase().trim();
        const match =
          s.title?.toLowerCase().includes(q) ||
          s.location?.toLowerCase().includes(q) ||
          s.date?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [stories, storySearch]);

  const totalStoryPages = Math.ceil(filteredStories.length / storyPageSize) || 1;
  const safeStoryPage = Math.min(storyPage, totalStoryPages);
  const pagedStories = useMemo(() => {
    const start = (safeStoryPage - 1) * storyPageSize;
    return filteredStories.slice(start, start + storyPageSize);
  }, [filteredStories, safeStoryPage, storyPageSize]);

  // Filtered pillars
  const filteredPillars = useMemo(() => {
    return pillars.filter((p) => {
      if (pillarSearch.trim()) {
        const q = pillarSearch.toLowerCase().trim();
        const match =
          p.title?.toLowerCase().includes(q) ||
          p.desc?.toLowerCase().includes(q) ||
          p.icon?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [pillars, pillarSearch]);

  const totalPillarPages = Math.ceil(filteredPillars.length / pillarPageSize) || 1;
  const safePillarPage = Math.min(pillarPage, totalPillarPages);
  const pagedPillars = useMemo(() => {
    const start = (safePillarPage - 1) * pillarPageSize;
    return filteredPillars.slice(start, start + pillarPageSize);
  }, [filteredPillars, safePillarPage, pillarPageSize]);

  // Filtered news
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (newsSearch.trim()) {
        const q = newsSearch.toLowerCase().trim();
        const match =
          a.mainTitle?.toLowerCase().includes(q) ||
          a.outlet?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q) ||
          a.intro?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [articles, newsSearch]);

  const totalNewsPages = Math.ceil(filteredArticles.length / newsPageSize) || 1;
  const safeNewsPage = Math.min(newsPage, totalNewsPages);
  const pagedArticles = useMemo(() => {
    const start = (safeNewsPage - 1) * newsPageSize;
    return filteredArticles.slice(start, start + newsPageSize);
  }, [filteredArticles, safeNewsPage, newsPageSize]);

  // Open Story Create/Edit
  const openStoryEdit = (st) => {
    setErrors({});
    setEditingStory({
      isNew: false,
      values: JSON.parse(JSON.stringify(st)),
    });
  };

  const openStoryCreate = () => {
    setErrors({});
    setEditingStory({
      isNew: true,
      values: { ...BLANK_STORY, id: `outreach-story-${Date.now()}` },
    });
  };

  // Open Pillar Create/Edit
  const openPillarEdit = (pl) => {
    setErrors({});
    setEditingPillar({
      isNew: false,
      values: JSON.parse(JSON.stringify(pl)),
    });
  };

  const openPillarCreate = () => {
    setErrors({});
    setEditingPillar({
      isNew: true,
      values: { ...BLANK_PILLAR, id: `pillar-${Date.now()}` },
    });
  };

  // Open News Create/Edit
  const openNewsEdit = (art) => {
    setErrors({});
    setEditingArticle({
      isNew: false,
      values: JSON.parse(JSON.stringify(art)),
    });
  };

  const openNewsCreate = () => {
    setErrors({});
    setEditingArticle({
      isNew: true,
      values: { ...BLANK_ARTICLE, id: `news-${Date.now()}` },
    });
  };

  // Save Story
  const handleSaveStory = async () => {
    const v = editingStory.values;
    const errs = {};
    if (!v.title?.trim()) errs.title = "Please enter the story title.";
    if (!v.date?.trim()) errs.date = "Please enter the date or period.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const copy = JSON.parse(JSON.stringify(content));
    if (!copy.events) copy.events = {};
    if (!copy.events.communityOutreach) copy.events.communityOutreach = { stories: [] };
    if (!Array.isArray(copy.events.communityOutreach.stories)) copy.events.communityOutreach.stories = [];

    if (editingStory.isNew) {
      copy.events.communityOutreach.stories.push(v);
    } else {
      const idx = copy.events.communityOutreach.stories.findIndex((s) => s.id === v.id);
      if (idx >= 0) copy.events.communityOutreach.stories[idx] = v;
      else copy.events.communityOutreach.stories.push(v);
    }

    const ok = await onSave(copy);
    if (ok) setEditingStory(null);
    return ok;
  };

  // Save Pillar
  const handleSavePillar = async () => {
    const v = editingPillar.values;
    const errs = {};
    if (!v.title?.trim()) errs.title = "Please enter the pillar title.";
    if (!v.desc?.trim()) errs.desc = "Please enter the pillar description.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const copy = JSON.parse(JSON.stringify(content));
    if (!copy.events) copy.events = {};
    if (!copy.events.communityOutreach) copy.events.communityOutreach = { stories: [], pillars: [] };
    if (!Array.isArray(copy.events.communityOutreach.pillars)) copy.events.communityOutreach.pillars = [];

    if (editingPillar.isNew) {
      copy.events.communityOutreach.pillars.push(v);
    } else {
      const idx = copy.events.communityOutreach.pillars.findIndex((p) => p.id === v.id);
      if (idx >= 0) copy.events.communityOutreach.pillars[idx] = v;
      else copy.events.communityOutreach.pillars.push(v);
    }

    const ok = await onSave(copy);
    if (ok) setEditingPillar(null);
    return ok;
  };

  // Save News
  const handleSaveNews = async () => {
    const v = editingArticle.values;
    const errs = {};
    if (!v.outlet?.trim()) errs.outlet = "Please enter the news outlet name.";
    if (!v.mainTitle?.trim()) errs.mainTitle = "Please enter the headline title.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const copy = JSON.parse(JSON.stringify(content));
    if (!copy.events) copy.events = {};
    if (!copy.events.headlinesNews) copy.events.headlinesNews = { articles: [] };
    if (!Array.isArray(copy.events.headlinesNews.articles)) copy.events.headlinesNews.articles = [];

    if (editingArticle.isNew) {
      copy.events.headlinesNews.articles.push(v);
    } else {
      const idx = copy.events.headlinesNews.articles.findIndex((a) => a.id === v.id);
      if (idx >= 0) copy.events.headlinesNews.articles[idx] = v;
      else copy.events.headlinesNews.articles.push(v);
    }

    const ok = await onSave(copy);
    if (ok) setEditingArticle(null);
    return ok;
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingConfirm) return;
    const copy = JSON.parse(JSON.stringify(content));

    if (deletingConfirm.type === "story") {
      if (copy.events?.communityOutreach?.stories) {
        copy.events.communityOutreach.stories = copy.events.communityOutreach.stories.filter(
          (s) => s.id !== deletingConfirm.id
        );
      }
    } else if (deletingConfirm.type === "pillar") {
      if (copy.events?.communityOutreach?.pillars) {
        copy.events.communityOutreach.pillars = copy.events.communityOutreach.pillars.filter(
          (p) => p.id !== deletingConfirm.id
        );
      }
    } else if (deletingConfirm.type === "article") {
      if (copy.events?.headlinesNews?.articles) {
        copy.events.headlinesNews.articles = copy.events.headlinesNews.articles.filter(
          (a) => a.id !== deletingConfirm.id
        );
      }
    }

    const ok = await onSave(copy);
    if (ok) setDeletingConfirm(null);
  };

  if (editingStory) return <ContentPreviewEditor kind="story" editing={editingStory} onChange={setEditingStory} onSave={handleSaveStory} onClose={()=>setEditingStory(null)} errors={errors} />;
  if (editingPillar) return <ContentPreviewEditor kind="pillar" editing={editingPillar} onChange={setEditingPillar} onSave={handleSavePillar} onClose={()=>setEditingPillar(null)} errors={errors} />;
  if (editingArticle) return <ContentPreviewEditor kind="article" editing={editingArticle} onChange={setEditingArticle} onSave={handleSaveNews} onClose={()=>setEditingArticle(null)} errors={errors} />;
  return (
    <div className="outreach-news-admin">
      {/* Sub-navigation tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--color-neutral-200)", marginBottom: "1.25rem" }}>
        <button
          type="button"
          onClick={() => setActiveSubTab("outreach")}
          style={{
            padding: "0.6rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeSubTab === "outreach" ? "3px solid var(--color-purple-600)" : "3px solid transparent",
            color: activeSubTab === "outreach" ? "var(--color-purple-600)" : "var(--color-neutral-600)",
            fontWeight: activeSubTab === "outreach" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          🗣️ Community Outreach Stories ({stories.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("pillars")}
          style={{
            padding: "0.6rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeSubTab === "pillars" ? "3px solid var(--color-purple-600)" : "3px solid transparent",
            color: activeSubTab === "pillars" ? "var(--color-purple-600)" : "var(--color-neutral-600)",
            fontWeight: activeSubTab === "pillars" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          🏛️ Dialogue Core Pillars ({pillars.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("news")}
          style={{
            padding: "0.6rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeSubTab === "news" ? "3px solid var(--color-purple-600)" : "3px solid transparent",
            color: activeSubTab === "news" ? "var(--color-purple-600)" : "var(--color-neutral-600)",
            fontWeight: activeSubTab === "news" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          📰 Press Highlights &amp; Clippings ({articles.length})
        </button>
      </div>

      {/* SUB-SECTION 1: COMMUNITY OUTREACH */}
      {activeSubTab === "outreach" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Community Outreach Stories &amp; Dialogue Gallery</h2>
              <p style={{ margin: "0.25rem 0 0", color: "var(--color-purple-600)", fontSize: "0.9rem" }}>
                Spotlight regional training cohorts, grassroots dialogues, and community photo galleries.
              </p>
            </div>
            <button
              type="button"
              className="tp-btn"
              onClick={openStoryCreate}
              style={{ minWidth: "180px", whiteSpace: "nowrap" }}
            >
              + Add Outreach Story
            </button>
          </div>

          {/* Search bar */}
          <div className="tp-filter-bar">
            <input
              type="text"
              className="tp-search-input"
              placeholder="🔍 Search outreach stories by title, location, date, description..."
              value={storySearch}
              onChange={(e) => {
                setStorySearch(e.target.value);
                setStoryPage(1);
              }}
              aria-label="Search outreach stories"
            />
            {storySearch.trim() !== "" && (
              <button
                type="button"
                className="tp-btn tp-btn-ghost"
                onClick={() => {
                  setStorySearch("");
                  setStoryPage(1);
                }}
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Table Meta */}
          <div className="tp-table-meta">
            <div>
              Showing <strong>{filteredStories.length === 0 ? 0 : (safeStoryPage - 1) * storyPageSize + 1}</strong>–
              <strong>{Math.min(safeStoryPage * storyPageSize, filteredStories.length)}</strong> of{" "}
              <strong>{filteredStories.length}</strong> stories
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label htmlFor="st-pagesize" style={{ fontSize: "0.88rem" }}>Rows per page:</label>
              <select
                id="st-pagesize"
                value={storyPageSize}
                onChange={(e) => {
                  setStoryPageSize(Number(e.target.value));
                  setStoryPage(1);
                }}
                style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--color-purple-400)" }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredStories.length === 0 ? (
            <div className="tp-card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "var(--color-purple-600)", margin: 0 }}>No outreach stories found.</p>
            </div>
          ) : (
            <div className="tp-table-wrap">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: "220px" }}>Story Title</th>
                    <th style={{ minWidth: "140px" }}>Date</th>
                    <th style={{ minWidth: "140px" }}>Location</th>
                    <th style={{ minWidth: "240px" }}>Description Overview</th>
                    <th style={{ minWidth: "140px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedStories.map((st) => (
                    <tr key={st.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--color-neutral-900)", marginBottom: "2px" }}>
                          {st.title}
                        </div>
                        {st.subtitle && (
                          <div style={{ fontSize: "0.8rem", color: "var(--color-neutral-500)" }}>
                            {st.subtitle}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "var(--color-neutral-700)" }}>
                          📅 {st.date}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, background: "#ecfdf5", color: "#047857", padding: "2px 8px", borderRadius: "4px" }}>
                          📍 {st.location || "Sarawak"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.82rem", color: "var(--color-neutral-600)", maxWidth: "340px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {st.description}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="tp-btn tp-btn-ghost"
                            style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.82rem" }}
                            onClick={() => openStoryEdit(st)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="tp-btn tp-btn-ghost"
                            style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.82rem", color: "#b91c1c", borderColor: "#fca5a5" }}
                            onClick={() => setDeletingConfirm({ type: "story", id: st.id, title: st.title })}
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
          {totalStoryPages > 1 && (
            <div className="tp-pagination">
              <button
                type="button"
                className="tp-page-btn"
                disabled={safeStoryPage <= 1}
                onClick={() => setStoryPage((p) => Math.max(1, p - 1))}
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalStoryPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`tp-page-btn ${num === safeStoryPage ? "active" : ""}`}
                  onClick={() => setStoryPage(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="tp-page-btn"
                disabled={safeStoryPage >= totalStoryPages}
                onClick={() => setStoryPage((p) => Math.min(totalStoryPages, p + 1))}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-SECTION: DIALOGUE CORE PILLARS */}
      {activeSubTab === "pillars" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Community Dialogue Core Pillars</h2>
              <p style={{ margin: "0.25rem 0 0", color: "var(--color-purple-600)", fontSize: "0.9rem" }}>
                Define the foundational pillars shown under the Community Outreach section on the main website.
              </p>
            </div>
            <button
              type="button"
              className="tp-btn"
              onClick={openPillarCreate}
              style={{ minWidth: "160px", whiteSpace: "nowrap" }}
            >
              + Add Pillar
            </button>
          </div>

          {/* Search */}
          <div className="tp-filter-bar">
            <input
              type="text"
              className="tp-search-input"
              placeholder="🔍 Search pillars by title, icon or description..."
              value={pillarSearch}
              onChange={(e) => {
                setPillarSearch(e.target.value);
                setPillarPage(1);
              }}
              aria-label="Search pillars"
            />
            {pillarSearch.trim() !== "" && (
              <button
                type="button"
                className="tp-btn tp-btn-ghost"
                onClick={() => {
                  setPillarSearch("");
                  setPillarPage(1);
                }}
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Table Meta */}
          <div className="tp-table-meta">
            <div>
              Showing <strong>{filteredPillars.length === 0 ? 0 : (safePillarPage - 1) * pillarPageSize + 1}</strong>–
              <strong>{Math.min(safePillarPage * pillarPageSize, filteredPillars.length)}</strong> of{" "}
              <strong>{filteredPillars.length}</strong> pillars
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label htmlFor="pillarPageSizeSelect" style={{ fontSize: "0.85rem", color: "var(--color-purple-600)" }}>
                Rows:
              </label>
              <select
                id="pillarPageSizeSelect"
                value={pillarPageSize}
                onChange={(e) => {
                  setPillarPageSize(Number(e.target.value));
                  setPillarPage(1);
                }}
                className="tp-select"
                style={{ width: "auto", padding: "4px 8px", fontSize: "0.85rem" }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          {/* Pillars Table */}
          {pagedPillars.length === 0 ? (
            <div className="tp-empty-state">
              <p style={{ color: "var(--color-purple-600)", margin: 0 }}>No dialogue pillars found.</p>
            </div>
          ) : (
            <div className="tp-table-wrap">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th style={{ width: "80px", textAlign: "center" }}>Icon</th>
                    <th style={{ minWidth: "220px" }}>Pillar Title</th>
                    <th style={{ minWidth: "320px" }}>Description</th>
                    <th style={{ minWidth: "140px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedPillars.map((pl) => (
                    <tr key={pl.id}>
                      <td style={{ textAlign: "center", fontSize: "1.5rem" }}>
                        {pl.icon || "🌱"}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--color-neutral-900)" }}>
                          {pl.title}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.88rem", color: "var(--color-neutral-600)", lineHeight: 1.4 }}>
                          {pl.desc || pl.description}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="tp-btn tp-btn-ghost"
                            style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.82rem" }}
                            onClick={() => openPillarEdit(pl)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="tp-btn tp-btn-ghost"
                            style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.82rem", color: "#b91c1c", borderColor: "#fca5a5" }}
                            onClick={() => setDeletingConfirm({ type: "pillar", id: pl.id, title: pl.title })}
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
          {totalPillarPages > 1 && (
            <div className="tp-pagination">
              <button
                type="button"
                className="tp-page-btn"
                disabled={safePillarPage <= 1}
                onClick={() => setPillarPage((p) => Math.max(1, p - 1))}
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalPillarPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`tp-page-btn ${num === safePillarPage ? "active" : ""}`}
                  onClick={() => setPillarPage(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="tp-page-btn"
                disabled={safePillarPage >= totalPillarPages}
                onClick={() => setPillarPage((p) => Math.min(totalPillarPages, p + 1))}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-SECTION 2: PRESS HIGHLIGHTS & CLIPPINGS */}
      {activeSubTab === "news" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Sarawak Dementia Care in the News (Press Clippings)</h2>
              <p style={{ margin: "0.25rem 0 0", color: "var(--color-purple-600)", fontSize: "0.9rem" }}>
                Feature newspaper clippings, press coverage, and media spotlight articles with zoomable lightboxes.
              </p>
            </div>
            <button
              type="button"
              className="tp-btn"
              onClick={openNewsCreate}
              style={{ minWidth: "180px", whiteSpace: "nowrap" }}
            >
              + Add Press Article
            </button>
          </div>

          {/* Search */}
          <div className="tp-filter-bar">
            <input
              type="text"
              className="tp-search-input"
              placeholder="🔍 Search press articles by headline, newspaper outlet, category..."
              value={newsSearch}
              onChange={(e) => {
                setNewsSearch(e.target.value);
                setNewsPage(1);
              }}
              aria-label="Search articles"
            />
            {newsSearch.trim() !== "" && (
              <button
                type="button"
                className="tp-btn tp-btn-ghost"
                onClick={() => {
                  setNewsSearch("");
                  setNewsPage(1);
                }}
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Table Meta */}
          <div className="tp-table-meta">
            <div>
              Showing <strong>{filteredArticles.length === 0 ? 0 : (safeNewsPage - 1) * newsPageSize + 1}</strong>–
              <strong>{Math.min(safeNewsPage * newsPageSize, filteredArticles.length)}</strong> of{" "}
              <strong>{filteredArticles.length}</strong> articles
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label htmlFor="art-pagesize" style={{ fontSize: "0.88rem" }}>Rows per page:</label>
              <select
                id="art-pagesize"
                value={newsPageSize}
                onChange={(e) => {
                  setNewsPageSize(Number(e.target.value));
                  setNewsPage(1);
                }}
                style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--color-purple-400)" }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredArticles.length === 0 ? (
            <div className="tp-card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "var(--color-purple-600)", margin: 0 }}>No press articles found.</p>
            </div>
          ) : (
            <div className="tp-table-wrap">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: "180px" }}>Media Outlet</th>
                    <th style={{ minWidth: "220px" }}>Main Headline Title</th>
                    <th style={{ minWidth: "120px" }}>Category / Tag</th>
                    <th style={{ minWidth: "130px" }}>Language Tag</th>
                    <th style={{ minWidth: "130px" }}>Date</th>
                    <th style={{ minWidth: "140px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedArticles.map((art) => (
                    <tr key={art.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--color-neutral-900)" }}>
                          📰 {art.outlet}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--color-neutral-900)", marginBottom: "2px" }}>
                          {art.mainTitle}
                        </div>
                        {art.intro && (
                          <div style={{ fontSize: "0.8rem", color: "var(--color-neutral-500)", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {art.intro}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, background: "var(--color-neutral-100)", color: "var(--color-neutral-700)", padding: "2px 8px", borderRadius: "4px" }}>
                          {art.category || "Feature"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-purple-600)", background: "var(--color-purple-100)", padding: "2px 8px", borderRadius: "10px" }}>
                          {art.langPill || "English"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "var(--color-neutral-600)" }}>
                          {art.date}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="tp-btn tp-btn-ghost"
                            style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.82rem" }}
                            onClick={() => openNewsEdit(art)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="tp-btn tp-btn-ghost"
                            style={{ minHeight: "34px", padding: "4px 10px", fontSize: "0.82rem", color: "#b91c1c", borderColor: "#fca5a5" }}
                            onClick={() => setDeletingConfirm({ type: "article", id: art.id, title: art.mainTitle })}
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
          {totalNewsPages > 1 && (
            <div className="tp-pagination">
              <button
                type="button"
                className="tp-page-btn"
                disabled={safeNewsPage <= 1}
                onClick={() => setNewsPage((p) => Math.max(1, p - 1))}
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalNewsPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`tp-page-btn ${num === safeNewsPage ? "active" : ""}`}
                  onClick={() => setNewsPage(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="tp-page-btn"
                disabled={safeNewsPage >= totalNewsPages}
                onClick={() => setNewsPage((p) => Math.min(totalNewsPages, p + 1))}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}


      {/* DELETE CONFIRMATION MODAL */}
      {deletingConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "10px", maxWidth: "480px", width: "100%", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 0.5rem", color: "#991b1b" }}>Confirm Deletion</h3>
            <p style={{ margin: "0 0 1rem", color: "var(--color-neutral-600)", fontSize: "0.95rem" }}>
              Are you sure you want to delete <strong>{deletingConfirm.title}</strong>? It will no longer be visible on the public website.
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
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
