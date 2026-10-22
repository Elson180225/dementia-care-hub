import PublishedRecords from "../components/PublishedRecords";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

import educationImage from "../assets/understand-dementia.jpg";
import trainingImage from "../assets/Group_Photo_2.png";
import webinarImage from "../assets/learning-events.jpg";
import eventImage from "../assets/Get-involved-hero.png";
import beachImage from "../assets/Adelaide-Beach-volunteers.png";
import cataractsPoster from "../assets/Online_webinar/A_Practical_Webinar_on_Cataracts.jpg";
import alzheimers101Poster from "../assets/Online_webinar/Alzheimer's_101_Eye-Opening_Facts_About.jpg";
import earlyDetectionPoster from "../assets/Online_webinar/Early_Detection&Monitoring_of_Dementia(Chinese).jpg";
import wellnessPoster from "../assets/Online_webinar/Embracing_Wellness_Aging_with_Dignity_in_Sarawak.jpg";
import caregiverPoster from "../assets/Online_webinar/Essential_Care_Practical_Tips_for_Alzheimer's_Caregivers.jpg";
import toothLossPoster from "../assets/Online_webinar/Is_Tooth_Loss_Really_Part_of_Getting_Older_Webinar.jpg";
import decisionPoster from "../assets/Online_webinar/Making_the_most_Suitable_Decision.jpg";
import womenCarePoster from "../assets/Online_webinar/Peranan_Wanita_Dalam_Penjagaan_Alzheimer(Malay).jpg";
import awarenessPoster from "../assets/Online_webinar/Poster_Alzheimer's_Awareness_Webinar.jpg";
import safeHomePoster from "../assets/Online_webinar/Safe_Space_Adapting_the_Home_for_Alzheimer's_Care.jpg";
import osteoporosisPoster from "../assets/Online_webinar/Silent_but_Serious_Understanding_and_Preventing_OSTEOPOROSIS.jpg";
import caregiverSupportImg from "../assets/caregiver-support.jpg";
import healthcareSupportImg from "../assets/healthcare-support.jpg";
import dcsFamilyPoster from "../assets/Certified_Trainer_Webinar/What_is_DCS-Family_16th_May_2026_Poster.jpg";
import dcsFamilyImage from "../assets/Certified_Trainer_Webinar/What_is_DCS-Family_16th_May_2026.jpg";
import oralHealthQa from "../assets/Grouped_Q&A/Oral Health Webinar/page1.jpg";
import preventionQa from "../assets/Grouped_Q&A/Prevention&Early Detection (Chinese)/page1.jpg";
import missingPiecesQa from "../assets/Grouped_Q&A/Understanding the Missing Pieces/page1.jpg";

import yearlyCalendar2026Poster from "../assets/Yearly_Activities(Past&Future)/1st_Half_Yearly_Activity_Calender_2026(Finding the missing pieces).jpg";
import dialogueImg1 from "../assets/Dialogue/2025_8_16.jpg";
import dialogueImg2 from "../assets/Dialogue/2025_8_16(1).jpg";
import newsSinChew from "../assets/News/Malaysia_Sin_Chew_Daily.jpg";
import newsSeeHua from "../assets/News/See_Hua_Daily_News.jpg";
import adfmPoster from "../assets/Certified_Trainer_Webinar/ADFM_Certified_Trainers_Poster.jpg";
import facilitatorInfo from "../assets/Certified_Trainer_Webinar/Facilitator_Certified_ADFM_Trainer/Facilitator_Information.jpg";

import {
  activities as defaultActivities,
  trainers as defaultTrainers,
  pageInfo,
  sectionOrder,
  pathFor,
  physicalProgrammes,
  learningResources,
  activityTypes,
  modes,
  cities,
  languages,
} from "../data/learn-events-data";
import "./LearnEvents.css";

function usePublicActivities() {
  const [rows, setRows] = useState(defaultActivities);
  useEffect(() => {
    let active = true;
    fetch('/api/activities')
      .then(r => { if (!r.ok) throw new Error('Activities unavailable'); return r.json(); })
      .then(data => {
        if (active && Array.isArray(data) && data.length > 0) {
          setRows(data.map(a => ({ ...a, date: a.starts_at, registrationLink: a.registration_link, poster: a.poster_url, location: a.venue, registrationDeadline: a.registration_deadline, capacity: a.capacity, trainers: a.trainers || [], status: a.cancelled_at ? 'cancelled' : ['completed', 'verified', 'archived'].includes(a.status) ? 'completed' : 'upcoming' })));
        }
      })
      .catch(() => { });
    return () => { active = false; };
  }, []);
  return rows;
}

/* ---- image resolver ---- */
const imageMap = {
  "understand-dementia": educationImage,
  Group_Photo_2: trainingImage,
  "learning-events": webinarImage,
  "Get-involved-hero": eventImage,
  "Adelaide-Beach-volunteers": beachImage,
};

const onlineWebinars = [
  { id: "webinar-alzheimers-101", title: "Alzheimer's 101: Eye-opening facts", type: "RCBC Webinar", status: "completed", date: "Past webinar", mode: "Online", language: "English", description: "A public introduction to Alzheimer’s disease and the facts families should know.", poster: alzheimers101Poster },
  { id: "webinar-awareness", title: "Alzheimer's Awareness Webinar", type: "RCBC Webinar", status: "completed", date: "Past webinar", mode: "Online", language: "English", description: "An accessible session for building awareness and understanding in the community.", poster: awarenessPoster },
  { id: "webinar-early-detection", title: "Early Detection & Monitoring of Dementia", type: "RCBC Webinar", status: "completed", date: "Past webinar", mode: "Online", language: "中文", description: "Information about recognising changes early and discussing concerns with a healthcare professional.", poster: earlyDetectionPoster },
  { id: "webinar-wellness", title: "Embracing Wellness: Ageing with Dignity in Sarawak", type: "RCBC Webinar", status: "completed", date: "Past webinar", mode: "Online", language: "English", description: "A conversation about wellbeing, dignity, and support as people age.", poster: wellnessPoster },
  { id: "webinar-care", title: "Essential Care: Practical Tips for Alzheimer’s Caregivers", type: "RCBC Webinar", status: "completed", date: "Past webinar", mode: "Online", language: "English", description: "Practical ideas for caregivers supporting everyday routines and care needs.", poster: caregiverPoster },
  { id: "webinar-women", title: "Peranan Wanita Dalam Penjagaan Alzheimer", type: "RCBC Webinar", status: "completed", date: "Past webinar", mode: "Online", language: "Bahasa Melayu", description: "A Malay-language conversation about women’s roles and experiences in Alzheimer’s care.", poster: womenCarePoster },
  { id: "webinar-safe-home", title: "Safe Space: Adapting the Home for Alzheimer’s Care", type: "RCBC Webinar", status: "completed", date: "Past webinar", mode: "Online", language: "English", description: "Ideas for making everyday home environments safer and more supportive.", poster: safeHomePoster },
  { id: "webinar-decisions", title: "Making the Most Suitable Decision", type: "RCBC Webinar", status: "completed", date: "Past webinar", mode: "Online", language: "English", description: "A reflective session about making informed care decisions with families.", poster: decisionPoster },
  { id: "webinar-cataracts", title: "A Practical Webinar on Cataracts", type: "RCBC Webinar", status: "completed", date: "Past webinar", mode: "Online", language: "English", description: "A practical health education session on cataracts and ageing.", poster: cataractsPoster },
  { id: "webinar-tooth-loss", title: "Is Tooth Loss Really Part of Getting Older?", type: "RCBC Webinar", status: "completed", date: "Past webinar", mode: "Online", language: "English", description: "A public education session about oral health and ageing.", poster: toothLossPoster },
  { id: "webinar-osteoporosis", title: "Silent but Serious: Understanding Osteoporosis", type: "RCBC Webinar", status: "completed", date: "Past webinar", mode: "Online", language: "English", description: "An educational session about osteoporosis prevention and awareness.", poster: osteoporosisPoster },
];

const trainerWebinars = [
  {
    id: "trainer-dcs-family",
    title: "Basic Dementia Care Skill (Family) Course — DCS-Family",
    type: "DCS-Family",
    status: "upcoming",
    date: "16 May 2026",
    time: "9:00 AM – 6:00 PM",
    mode: "Physical",
    location: "Hock Lee Hotel & Residence, Kuching",
    language: "English / Bahasa Melayu / 中文",
    description: "Foundation Dementia Care Course for family caregivers delivered by 12 ADFM-Certified Trainers. Covering 6 core modules, limited to 100 seats.",
    poster: dcsFamilyPoster,
  },
];

const qaResources = [
  { title: "Oral Health Webinar Q&A", language: "English", image: oralHealthQa, pages: 14, images: [oralHealthQa] },
  { title: "Prevention & Early Detection Q&A", language: "中文", image: preventionQa, pages: 5, images: [preventionQa] },
  { title: "Understanding the Missing Pieces Q&A", language: "English", image: missingPiecesQa, pages: 4, images: [missingPiecesQa] },
];

const qaImageModules = import.meta.glob("../assets/Grouped_Q&A/**/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
});

function getQaImages(folderName, fallback) {
  const images = Object.entries(qaImageModules)
    .filter(([path]) => path.includes(`/Grouped_Q&A/${folderName}/`))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, url]) => url);
  return images.length > 0 ? images : fallback;
}

qaResources[0].images = getQaImages("Oral Health Webinar", qaResources[0].images);
qaResources[1].images = getQaImages("Prevention&Early Detection (Chinese)", qaResources[1].images);
qaResources[2].images = getQaImages("Understanding the Missing Pieces", qaResources[2].images);

const plannedTopicsList = [
  {
    id: "topic-webinar-season-1-2026",
    month: "APR",
    day: "11",
    year: "2026",
    title: "Webinar – Season 1 (Alzheimer's Care Project)",
    date: "11 Apr 2026",
    time: "80 minutes",
    mode: "Online",
    location: "Online",
    language: "English / Bahasa Melayu",
    speaker: "RCBC & ADFM Specialists",
    suitableFor: "General public, families and caregivers",
    description: "Opening online education webinar for the 2026 Season under the Alzheimer's Care Project 'Finding the Missing Pieces'. Conducted primarily in English with Bahasa Malaysia support provided where appropriate.",
    image: webinarImage,
    poster: webinarImage,
    type: "RCBC Webinar",
    status: "upcoming",
  },
  {
    id: "topic-dcs-family-2026",
    month: "MAY",
    day: "16",
    year: "2026",
    title: "Basic Dementia Care Skill (Family) Course — DCS-Family",
    date: "16 May 2026",
    time: "9:00 AM – 6:00 PM",
    mode: "Physical",
    location: "Hock Lee Hotel & Residence, Kuching",
    language: "English / Bahasa Melayu / 中文",
    speaker: "12 ADFM-Certified Trainers & Advisory Specialists",
    suitableFor: "Family caregivers, community helpers, and those interested in dementia care",
    description: "Foundation Dementia Care Course covering 6 core modules: Basic DCS, Person-Centred Care, Effective Communication, BPSD, Meaningful Activities, and Advance Care Planning. Limited to 100 seats only.",
    image: dcsFamilyPoster,
    poster: dcsFamilyPoster,
    type: "DCS-Family",
    status: "upcoming",
  },
  {
    id: "topic-dcs-ttt-2026",
    month: "JUN",
    day: "26",
    year: "2026",
    title: "Dementia Care Skill – Train the Trainer Program — DCS-TTT",
    date: "26 Jun 2026",
    time: "9:00 AM – 5:00 PM (3-Day Program, 26–28 Jun 2026)",
    mode: "Physical",
    location: "Kuching",
    language: "English / Bahasa Melayu",
    speaker: "Dr. Tiong Ing Khieng & ADFM Training Team",
    suitableFor: "Healthcare professionals, nurses, therapists, community educators",
    description: "3-day Train-the-Trainer program in Kuching to train and certify healthcare educators and community champions across Sarawak under ADFM credentialing.",
    image: adfmPoster,
    poster: adfmPoster,
    type: "DCS-TTT",
    status: "upcoming",
  },
];

/* ---- status badge ---- */
function StatusBadge({ status }) {
  const labels = {
    upcoming: "Upcoming",
    completed: "Completed",
    "registration-closed": "Registration closed",
  };
  return (
    <span className={`status-badge status-${status}`}>
      {labels[status] || status}
    </span>
  );
}

/* ---- mode icon ---- */
function ModeIcon({ mode }) {
  if (mode === "Online") {
    return (
      <span className="mode-tag mode-online">
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="4" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 18v3" />
        </svg>
        Online
      </span>
    );
  }
  return (
    <span className="mode-tag mode-physical">
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      Physical
    </span>
  );
}

/* ================================================================
   ACTIVITY LANDING PAGE MODAL
   Reusable detail view for any activity — matches PDF Section 4
   ================================================================ */
function ActivityModal({ activity, onClose }) {
  const { t } = useLanguage();
  const am = t.learnEvents?.activityModal || {};
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!activity) return undefined;
    dialogRef.current?.focus({ preventScroll: true });
    const close = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [activity, onClose]);

  if (!activity) return null;

  const isCompleted = activity.status === "completed";

  return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="webinar-modal activity-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close activity details"
        >
          {"\u00D7"}
        </button>

        <div className="activity-modal-header">
          <span className="tag">{activity.type}</span>
          <StatusBadge status={activity.status} />
        </div>

        <h2 id="activity-title">{activity.title}</h2>

        <dl className="activity-details">
          <div>
            <dt>{am.suitableFor || "Suitable for"}</dt>
            <dd>{activity.suitableFor || "Public, families and caregivers"}</dd>
          </div>
          <div>
            <dt>{am.dateTime || "Date & time"}</dt>
            <dd>
              {activity.date || am.pastWebinar || "Past webinar"}
              <br />
              {activity.time}
            </dd>
          </div>
          <div>
            <dt>{am.mode || "Mode"}</dt>
            <dd>
              <ModeIcon mode={activity.mode} />
            </dd>
          </div>
          <div>
            <dt>{am.location || "Location"}</dt>
            <dd>{activity.location || am.online || "Online"}</dd>
          </div>
          <div>
            <dt>{am.language || "Language"}</dt>
            <dd>{activity.language}</dd>
          </div>
          <div>
            <dt>{am.speakerTrainer || "Speaker / trainer"}</dt>
            <dd>
              {activity.speaker || "RCBC Education Team"}
              {activity.trainerId && (
                <>
                  {" \u2014 "}
                  <Link
                    to="/learn-events/certified-trainers"
                    onClick={onClose}
                  >
                    {am.viewTrainerProfile || "View trainer profile"}
                  </Link>
                </>
              )}
            </dd>
          </div>
        </dl>

        <div className="activity-description">
          <h3>{am.whatYouWillLearn || "What you will learn"}</h3>
          <p>{activity.description}</p>
        </div>

        {activity.poster && (
          <div className="activity-poster" aria-hidden="true">
            <img src={activity.poster} alt="" />
          </div>
        )}

        <div className="activity-modal-footer">
          {isCompleted ? (
            <>
              {activity.recordingLink !== undefined &&
                activity.recordingLink !== null && (
                  <button type="button" className="activity-action-btn">
                    {am.viewRecording || "View recording"}
                  </button>
                )}
              {activity.materials && (
                <p className="activity-materials">
                  Available materials: {activity.materials}
                </p>
              )}
            </>
          ) : activity.registrationLink !== undefined &&
            activity.registrationLink !== null ? (
            <a
              href={activity.registrationLink || "#"}
              target="_blank"
              rel="noreferrer"
              className="activity-action-btn activity-action-register"
            >
              {am.registerNow || "Register now"}
              <small>{am.externalTabNote || "opens external form in a new tab"}</small>
            </a>
          ) : (
            <button type="button" disabled className="activity-action-btn">
              {am.registrationLinkPending || "Registration link to be added"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function QAModal({ resource, onClose }) {
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(0);
  const dialogRef = useRef(null);
  const totalPages = resource.images.length;

  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
    const close = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setCurrentPage((page) => (page - 1 + totalPages) % totalPages);
      if (event.key === "ArrowRight") setCurrentPage((page) => (page + 1) % totalPages);
    };
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [onClose, totalPages]);

  const previousPage = () => setCurrentPage((page) => (page - 1 + totalPages) % totalPages);
  const nextPage = () => setCurrentPage((page) => (page + 1) % totalPages);

  return createPortal(
    <div
      className="qa-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="qa-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qa-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close Q&A viewer"
        >
          ×
        </button>
        <div className="qa-modal-heading">
          <span className="tag">{resource.language}</span>
          <h2 id="qa-title">{resource.title}</h2>
          <p>{(t.learnEvents?.activityModal?.pageOf || "Page {current} of {total}").replace('{current}', currentPage + 1).replace('{total}', totalPages)}</p>
        </div>
        <div className="qa-viewer">
          <button
            type="button"
            className="qa-nav qa-nav-prev"
            onClick={previousPage}
            aria-label="Previous Q&A page"
          >
            ‹
          </button>
          <img
            src={resource.images[currentPage]}
            alt={`${resource.title}, page ${currentPage + 1}`}
          />
          <button
            type="button"
            className="qa-nav qa-nav-next"
            onClick={nextPage}
            aria-label="Next Q&A page"
          >
            ›
          </button>
        </div>
        <div className="qa-page-dots" aria-label="Q&A pages">
          {resource.images.map((_, index) => (
            <button
              type="button"
              key={index}
              className={index === currentPage ? "is-active" : ""}
              onClick={() => setCurrentPage(index)}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ArchiveToolbar({ label, filters, onFiltersChange, totalCount, onReset }) {
  const { t } = useLanguage();
  const le = t.learnEvents;
  const pm = le?.programModal || {};
  const isFiltered = Boolean(
    filters.query.trim() ||
    filters.language !== "All" ||
    (filters.timing && filters.timing !== "All")
  );

  return (
    <div className="archive-toolbar">
      <div className="archive-search-box">
        <svg
          className="archive-search-icon"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={filters.query}
          onChange={(event) =>
            onFiltersChange({ ...filters, query: event.target.value })
          }
          placeholder={le?.searchPlaceholder || `Search ${label.toLowerCase()} by topic or title...`}
          aria-label={`Search ${label}`}
        />
        {filters.query && (
          <button
            type="button"
            className="archive-search-clear"
            onClick={() => onFiltersChange({ ...filters, query: "" })}
            aria-label="Clear search text"
          >
            ×
          </button>
        )}
      </div>

      <div className="archive-filter-group">
        <div className="archive-select-wrapper">
          <select
            aria-label={`Filter ${label} by language`}
            value={filters.language}
            onChange={(event) =>
              onFiltersChange({ ...filters, language: event.target.value })
            }
          >
            <option value="All">{le?.allLanguages || "All languages"}</option>
            <option value="English">{pm.languages?.en || "English"}</option>
            <option value="Bahasa Melayu">{pm.languages?.ms || "Bahasa Melayu"}</option>
            <option value="中文">中文</option>
          </select>
        </div>

        {filters.timing !== undefined && (
          <div className="archive-select-wrapper">
            <select
              aria-label={`Filter ${label} by status`}
              value={filters.timing}
              onChange={(event) =>
                onFiltersChange({ ...filters, timing: event.target.value })
              }
            >
              <option value="All">{le?.all || "All sessions"}</option>
              <option value="Past">{le?.past || "Past sessions"}</option>
              <option value="Future">{le?.upcoming || "Upcoming"}</option>
            </select>
          </div>
        )}

        {isFiltered && (
          <button
            type="button"
            className="archive-reset-btn"
            onClick={onReset}
            title={le?.clearFilters || "Clear active filters"}
          >
            {le?.clearFilters || "Clear filters"}
          </button>
        )}

        <span className="archive-results-badge">
          {totalCount} {totalCount === 1 ? (le?.item || "item") : (le?.items || "items")}
        </span>
      </div>
    </div>
  );
}

function ArchivePagination({ label, page, pageCount, onPageChange }) {
  const { t } = useLanguage();
  const le = t.learnEvents;
  if (pageCount <= 1) return null;

  return (
    <div className="archive-pagination-bar" aria-label={`${label} pagination`}>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label={`Previous ${label} page`}
      >
        {le?.previous || "← Previous"}
      </button>
      <span>
        {le?.page || "Page"} <strong>{page}</strong> {le?.of || "of"} <strong>{pageCount}</strong>
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === pageCount}
        aria-label={`Next ${label} page`}
      >
        {le?.next || "Next →"}
      </button>
    </div>
  );
}

function ArchiveEmptyState({ label, onReset }) {
  const { t } = useLanguage();
  const am = t.learnEvents?.activityModal || {};
  return (
    <div className="archive-empty-state">
      <div className="empty-state-icon">
        <svg
          viewBox="0 0 24 24"
          width="36"
          height="36"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>
      <h4>{am.noResultsFound || `No ${label.toLowerCase()} found`}</h4>
      <p>{am.noResultsDesc || "Try searching with different keywords or clearing your active filters."}</p>
      <button
        type="button"
        className="archive-reset-btn primary"
        onClick={onReset}
      >
        {am.resetFilters || "Reset filters"}
      </button>
    </div>
  );
}

function pageItems(items, filters, page) {
  const filtered = items.filter((item) => {
    const status = item.status || "completed";
    const query = filters.query.trim().toLowerCase();
    const matchesSearch =
      !query ||
      `${item.title} ${item.description || ""} ${item.language || ""}`
        .toLowerCase()
        .includes(query);
    const matchesLanguage =
      filters.language === "All" || item.language === filters.language;
    const matchesTiming =
      filters.timing === "All" ||
      (filters.timing === "Past" ? status === "completed" : status !== "completed");
    return matchesSearch && matchesLanguage && matchesTiming;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / 9));
  const safePage = Math.min(page, pageCount);
  return {
    items: filtered.slice((safePage - 1) * 9, safePage * 9),
    pageCount,
    page: safePage,
    totalCount: filtered.length,
  };
}

/* ================================================================
   SECTION 1: ONLINE EDUCATION
   ================================================================ */
function OnlineEducation() {
  const { t } = useLanguage();
  const le = t.learnEvents;
  const activities = usePublicActivities();
  const [selected, setSelected] = useState(null);
  const [selectedQa, setSelectedQa] = useState(null);
  const defaultFilters = { query: "", language: "All", timing: "All" };
  const [publicFilters, setPublicFilters] = useState(defaultFilters);
  const [trainerFilters, setTrainerFilters] = useState(defaultFilters);
  const [resourceFilters, setResourceFilters] = useState(defaultFilters);
  const [qaFilters, setQaFilters] = useState(defaultFilters);
  const [publicPage, setPublicPage] = useState(1);
  const [trainerPage, setTrainerPage] = useState(1);
  const [resourcePage, setResourcePage] = useState(1);
  const [qaPage, setQaPage] = useState(1);
  const [topicView, setTopicView] = useState("list");

  const rcbcWebinars = [...activities.filter((item) => item.type === "RCBC Webinar"), ...onlineWebinars];
  const ctWebinars = [...activities.filter((item) => item.type === "CT Webinar"), ...trainerWebinars];
  const archiveResources = learningResources.map((resource) => ({ ...resource, status: "completed" }));

  const publicResults = pageItems(rcbcWebinars, publicFilters, publicPage);
  const trainerResults = pageItems(ctWebinars, trainerFilters, trainerPage);
  const resourceResults = pageItems(archiveResources, resourceFilters, resourcePage);
  const qaResults = pageItems(qaResources.map((resource) => ({ ...resource, status: "completed" })), qaFilters, qaPage);

  return (
    <main className="module-main">
      {/* ---- RCBC Annual Webinar Series ---- */}
      <section className="content-section content-section-light">
        <div className="section-container">
          <div className="section-heading-block">
            <span className="section-label">{le?.rcbcLabel || "RCBC annual webinar series"}</span>
            <h2>{le?.rcbcTitle || "Previous & future public education webinars"}</h2>
            <p>
              {le?.rcbcDesc || "The annual RCBC webinar brings dementia education to the public. Recordings from previous years are preserved as learning resources."}
            </p>
          </div>

          <ArchiveToolbar
            label="Public webinars"
            filters={publicFilters}
            onFiltersChange={(value) => {
              setPublicFilters(value);
              setPublicPage(1);
            }}
            totalCount={publicResults.totalCount}
            onReset={() => {
              setPublicFilters(defaultFilters);
              setPublicPage(1);
            }}
          />

          {publicResults.items.length === 0 ? (
            <ArchiveEmptyState
              label="Public webinars"
              onReset={() => {
                setPublicFilters(defaultFilters);
                setPublicPage(1);
              }}
            />
          ) : (
            <div className="activity-grid">
              {publicResults.items.map((a) => (
                <article
                  className="activity-card"
                  key={a.id}
                  onClick={() => setSelected(a)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(a)}
                >
                  <div className="activity-card-thumb">
                    <img src={a.poster || webinarImage} alt={`${a.title} poster`} />
                  </div>
                  <div className="activity-card-body">
                    <div className="activity-card-top">
                      <span className="tag">{a.type}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <h3>{a.title}</h3>
                    <p>{a.description}</p>
                    <div className="activity-card-meta">
                      <span>{a.date}</span>
                      <ModeIcon mode={a.mode} />
                      <span>{a.language}</span>
                    </div>
                    <small className="activity-card-hint">
                      {le?.clickToView || "Click to view details"}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}

          <ArchivePagination
            label="Public webinars"
            page={publicResults.page}
            pageCount={publicResults.pageCount}
            onPageChange={setPublicPage}
          />
        </div>
      </section>

      {/* ---- Certified Trainer Webinars ---- */}
      <section className="content-section content-section-cream">
        <div className="section-container">
          <div className="section-heading-block">
            <span className="section-label">{le?.ctLabel || "Certified trainer webinars"}</span>
            <h2>{le?.ctTitle || "Education delivered by certified trainers"}</h2>
            <p>
              {le?.ctDesc || "Webinars conducted by trainers who have completed the DCS-TTT pathway. Each session connects to the trainer's profile."}
            </p>
          </div>

          <ArchiveToolbar
            label="Trainer webinars"
            filters={trainerFilters}
            onFiltersChange={(value) => {
              setTrainerFilters(value);
              setTrainerPage(1);
            }}
            totalCount={trainerResults.totalCount}
            onReset={() => {
              setTrainerFilters(defaultFilters);
              setTrainerPage(1);
            }}
          />

          {trainerResults.items.length === 0 ? (
            <ArchiveEmptyState
              label="Trainer webinars"
              onReset={() => {
                setTrainerFilters(defaultFilters);
                setTrainerPage(1);
              }}
            />
          ) : (
            <div className="activity-grid">
              {trainerResults.items.map((a) => (
                <article
                  className="activity-card"
                  key={a.id}
                  onClick={() => setSelected(a)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(a)}
                >
                  <div className="activity-card-thumb">
                    <img src={a.poster || webinarImage} alt={`${a.title} poster`} />
                  </div>
                  <div className="activity-card-body">
                    <div className="activity-card-top">
                      <span className="tag">{a.type}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <h3>{a.title}</h3>
                    <p>{a.description}</p>
                    <div className="activity-card-meta">
                      <span>{a.date}</span>
                      <ModeIcon mode={a.mode} />
                      <span>{a.language}</span>
                    </div>
                    <small className="activity-card-hint">
                      {le?.clickToView || "Click to view details"}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}

          <ArchivePagination
            label="Trainer webinars"
            page={trainerResults.page}
            pageCount={trainerResults.pageCount}
            onPageChange={setTrainerPage}
          />

          {/* ---- Upcoming webinar topics ---- */}
          <div className="planned-topics-wrapper">
            <div className="planned-topics-header">
              <div className="planned-topics-title-area">
                <span className="section-label">{le?.lookingAhead || "Looking ahead"}</span>
                <h3 className="planned-topics-title">{le?.upcomingEventsTitle || "Upcoming Events & Topics"}</h3>
                <p>
                  {le?.upcomingEventsDesc || "Future sessions shaped around the questions that matter most to families, caregivers, and trainers."}
                </p>
              </div>

              <div className="topics-view-switch" role="group" aria-label="Topic layout view switch">
                <button
                  type="button"
                  className={`view-switch-btn ${topicView === "list" ? "is-active" : ""}`}
                  onClick={() => setTopicView("list")}
                  aria-pressed={topicView === "list"}
                  title="List view"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <circle cx="3.5" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="3.5" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="3.5" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                  <span>{le?.listView || "LIST"}</span>
                </button>
                <button
                  type="button"
                  className={`view-switch-btn ${topicView === "grid" ? "is-active" : ""}`}
                  onClick={() => setTopicView("grid")}
                  aria-pressed={topicView === "grid"}
                  title="Grid view"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                  <span>{le?.gridView || "GRID"}</span>
                </button>
              </div>
            </div>

            {topicView === "list" ? (
              <div className="planned-topics-list">
                {plannedTopicsList.map((t) => (
                  <article className="planned-topic-row" key={t.id}>
                    <div className="topic-date-block">
                      <span className="topic-month">{t.month}</span>
                      <span className="topic-date-line" aria-hidden="true" />
                      <span className="topic-day">{t.day}</span>
                    </div>

                    <div className="topic-thumb">
                      <img src={t.image} alt={t.title} />
                    </div>

                    <div className="topic-details">
                      <h4 className="topic-title">{t.title}</h4>
                      <div className="topic-meta-line">
                        <span>{t.location}</span>
                        <span className="meta-bullet">•</span>
                        <span>{t.time}</span>
                        <span className="meta-bullet">•</span>
                        <span className="topic-lang-pill">{t.language}</span>
                      </div>
                      <p className="topic-desc">{t.description}</p>
                      <button
                        type="button"
                        className="topic-action-link"
                        onClick={() => setSelected(t)}
                      >
                        {le?.viewEventDetails || "View Event Details"} <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="planned-topics-grid">
                {plannedTopicsList.map((t) => (
                  <article
                    className="planned-topic-grid-card"
                    key={t.id}
                    onClick={() => setSelected(t)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelected(t)}
                  >
                    <div className="topic-grid-image">
                      <img src={t.image} alt={t.title} />
                      <div className="topic-grid-date-badge">
                        <span>{t.month}</span>
                        <strong>{t.day}</strong>
                      </div>
                    </div>
                    <div className="topic-grid-body">
                      <h4>{t.title}</h4>
                      <div className="topic-meta-line">
                        <span>{t.time}</span>
                        <span className="meta-bullet">•</span>
                        <span>{t.language}</span>
                      </div>
                      <p>{t.description}</p>
                      <span className="topic-action-link">{le?.viewEventDetails || "View Event Details"} →</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---- Learning Resources ---- */}
      <section className="content-section content-section-green">
        <div className="section-container">
          <div className="section-heading-block">
            <span className="section-label">{le?.approvedLabel || "Learning resources"}</span>
            <h2>{le?.approvedTitle || "Recordings, videos, Q&A and approved materials"}</h2>
            <p>
              {le?.approvedDesc || "Selected educational content from completed activities, preserved as ongoing learning resources. The archive grows as new activities are completed."}
            </p>
          </div>

          <ArchiveToolbar
            label="Learning resources"
            filters={resourceFilters}
            onFiltersChange={(value) => {
              setResourceFilters(value);
              setResourcePage(1);
            }}
            totalCount={resourceResults.totalCount}
            onReset={() => {
              setResourceFilters(defaultFilters);
              setResourcePage(1);
            }}
          />

          {resourceResults.items.length === 0 ? (
            <ArchiveEmptyState
              label="Learning resources"
              onReset={() => {
                setResourceFilters(defaultFilters);
                setResourcePage(1);
              }}
            />
          ) : (
            <div className="resource-grid">
              {resourceResults.items.map((r, index) => {
                const matchedQa =
                  qaResources[r.qaIndex !== undefined ? r.qaIndex : index % qaResources.length] ||
                  qaResources[0];
                const videoTargetUrl =
                  r.videoUrl ||
                  r.url ||
                  "https://www.facebook.com/rotarybintulucentral";

                return (
                  <article className="resource-card" key={r.id}>
                    <div className="resource-card-top">
                      <span className="resource-type">{r.type}</span>
                      <span className="resource-year">{r.year}</span>
                    </div>
                    <h3>{r.title}</h3>
                    <p>{r.description}</p>
                    <div className="resource-meta">
                      <span>{r.language}</span>
                      {r.duration !== "—" && <span>{r.duration}</span>}
                    </div>

                    <div className="resource-card-actions">
                      <a
                        className="resource-action-btn resource-btn-video"
                        href={videoTargetUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={`Watch video recording for ${r.title} (opens external link in new tab)`}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Watch recording ↗
                      </a>

                      <button
                        type="button"
                        className="resource-action-btn resource-btn-qa"
                        onClick={() => setSelectedQa(matchedQa)}
                        title={`Open and review uploaded Q&A images for ${r.title}`}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        Review Q&amp;A →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <ArchivePagination
            label="Learning resources"
            page={resourceResults.page}
            pageCount={resourceResults.pageCount}
            onPageChange={setResourcePage}
          />
        </div>
      </section>

      {/* ---- Q&A archive ---- */}
      <section className="content-section content-section-light qa-archive-section">
        <div className="section-container">
          <div className="section-heading-block">
            <span className="section-label">{le?.qaLabel || "Q&A archive"}</span>
            <h2>{le?.qaTitle || "Questions from previous learning sessions"}</h2>
            <p>
              {le?.qaDesc || "Browse selected Q&A image sets from past webinars. Open each collection to review the full set of questions and answers."}
            </p>
          </div>

          <ArchiveToolbar
            label="Q&A collections"
            filters={qaFilters}
            onFiltersChange={(value) => {
              setQaFilters(value);
              setQaPage(1);
            }}
            totalCount={qaResults.totalCount}
            onReset={() => {
              setQaFilters(defaultFilters);
              setQaPage(1);
            }}
          />

          {qaResults.items.length === 0 ? (
            <ArchiveEmptyState
              label="Q&A collections"
              onReset={() => {
                setQaFilters(defaultFilters);
                setQaPage(1);
              }}
            />
          ) : (
            <div className="qa-resource-grid">
              {qaResults.items.map((resource) => (
                <article
                  className="qa-resource-card"
                  key={resource.title}
                  onClick={() => setSelectedQa(resource)}
                  onKeyDown={(event) =>
                    event.key === "Enter" && setSelectedQa(resource)
                  }
                  role="button"
                  tabIndex={0}
                >
                  <div className="qa-resource-image">
                    <img src={resource.image} alt="" />
                    <span>{resource.pages} pages</span>
                  </div>
                  <div>
                    <span className="tag">{resource.language}</span>
                    <h3>{resource.title}</h3>
                    <span className="resource-link-btn">Review Q&amp;A →</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          <ArchivePagination
            label="Q&A collections"
            page={qaResults.page}
            pageCount={qaResults.pageCount}
            onPageChange={setQaPage}
          />
        </div>
      </section>

      {selectedQa && (
        <QAModal resource={selectedQa} onClose={() => setSelectedQa(null)} />
      )}

      {selected && (
        <ActivityModal activity={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}

/* ================================================================
   PROGRAM REGISTRATION / APPLICATION / WAITLIST MODAL
   ================================================================ */
function ProgramModal({ program, onClose }) {
  const { t } = useLanguage();
  const le = t.learnEvents;
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role:
      program.id === "dcs-family"
        ? "Family Caregiver / Relative"
        : program.id === "dcs-ttt"
          ? "Healthcare Professional / Educator"
          : "Direct-Care Worker / Nurse",
    preferredLanguage: "English",
    intakeLocation:
      program.cities && program.cities.length > 0 ? program.cities[0] : "Kuching",
    notes: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const pm = le?.programModal || {};
  const actionTitle =
    program.actionType === "apply"
      ? (pm.submitTtt || "Submit TTT Application")
      : program.actionType === "waitlist"
        ? (pm.submitWaitlist || "Join Priority Waitlist")
        : (pm.submitFamily || "Confirm DCS-Family Registration");

  return createPortal(
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="program-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="activity-modal program-modal" tabIndex={-1}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>

        <div className="program-modal-header">
          <div className="program-modal-badges">
            <span className="dcs-track-badge">{program.trackNumber}</span>
            <span className="dcs-status-pill">{program.badge}</span>
          </div>
          <h2 id="program-modal-title">{program.title}</h2>
          <p className="program-modal-role">{program.roleCategory}</p>
        </div>

        {isSubmitted ? (
          <div className="program-modal-success">
            <div className="success-icon-wrap" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#0d716b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3>{le?.registrationReceived || "Registration Details Received!"}</h3>
            <p>
              Thank you, <strong>{formData.fullName || "Caregiver / Applicant"}</strong>. Your entry for <strong>{program.title}</strong> has been successfully recorded.
            </p>
            <p className="success-note">
              {pm.successNote || "Our community training coordinator will contact you via WhatsApp / Phone to confirm session logistics, attendance requirements, and venue directions."}
            </p>
            <div className="program-modal-actions">
              <button
                type="button"
                className="activity-action-btn"
                onClick={onClose}
              >
                {le?.closeWindow || "Close Window"}
              </button>
            </div>
          </div>
        ) : (
          <form className="program-modal-form" onSubmit={handleSubmit}>
            <div className="program-modal-summary">
              <div>
                <strong>{pm.scheduledIntake || "Scheduled Intake"}:</strong> {program.schedule?.date} ({program.schedule?.time})
              </div>
              <div>
                <strong>{pm.locationLabel || "Location"}:</strong> {program.location}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="reg-name">{pm.fullName || "Full Name *"}</label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder={pm.fullNamePlaceholder || "e.g. Grace Wong"}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-phone">{pm.phone || "Phone / WhatsApp Number *"}</label>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  placeholder={pm.phonePlaceholder || "e.g. +60 12-345 6789"}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-email">{pm.email || "Email Address *"}</label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="e.g. grace@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-role">{pm.role || "Role / Background"}</label>
                <select
                  id="reg-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Family Caregiver / Relative">{pm.roles?.family || "Family Caregiver / Relative"}</option>
                  <option value="Healthcare Professional / Nurse">{pm.roles?.healthcare || "Healthcare Professional / Nurse"}</option>
                  <option value="Direct-Care Worker / Attendant">{pm.roles?.careWorker || "Direct-Care Worker / Attendant"}</option>
                  <option value="Community Volunteer">{pm.roles?.volunteer || "Community Volunteer"}</option>
                  <option value="Other">{pm.roles?.other || "Other"}</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="reg-lang">{pm.preferredLanguage || "Preferred Language"}</label>
                <select
                  id="reg-lang"
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                >
                  <option value="English">{pm.languages?.en || "English"}</option>
                  <option value="Bahasa Melayu">{pm.languages?.ms || "Bahasa Melayu"}</option>
                  <option value="Sarawak Malay / Local Dialect">{pm.languages?.sarawak || "Sarawak Malay / Local Dialect"}</option>
                  <option value="Mandarin / Dialects">{pm.languages?.zh || "Mandarin / Dialects"}</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="reg-city">{pm.preferredCity || "Preferred City / Training Venue"}</label>
                <select
                  id="reg-city"
                  value={formData.intakeLocation}
                  onChange={(e) => setFormData({ ...formData, intakeLocation: e.target.value })}
                >
                  {program.cities && program.cities.length > 0 ? (
                    program.cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))
                  ) : (
                    <option value="Kuching">Kuching</option>
                  )}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="reg-notes">{pm.notes || "Special Needs, Caregiving Challenges or Questions (Optional)"}</label>
              <textarea
                id="reg-notes"
                rows={3}
                placeholder={pm.notesPlaceholder || "Share any specific caregiving difficulties, dietary needs, or accessibility requests..."}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="program-modal-footer">
              <button
                type="button"
                className="activity-action-btn secondary"
                onClick={onClose}
              >
                {pm.cancel || "Cancel"}
              </button>
              <button
                type="submit"
                className="activity-action-btn"
              >
                {actionTitle}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ================================================================
   SECTION 2: PHYSICAL EDUCATION (INTERACTIVE 3-TRACK TABBED SHOWCASE)
   ================================================================ */
function PhysicalEducation() {
  const { t } = useLanguage();
  const le = t.learnEvents;
  const [activeTrackId, setActiveTrackId] = useState("dcs-family");
  const [activeModalProgram, setActiveModalProgram] = useState(null);

  const trackImages = {
    "dcs-family": dcsFamilyImage,
    "dcs-ttt": trainingImage,
    "dcs-care-worker": healthcareSupportImg,
  };

  const activeTrack =
    physicalProgrammes.find((p) => p.id === activeTrackId) || physicalProgrammes[0];

  return (
    <main className="module-main physical-education-main">
      {/* ---- Interactive 3-Track Showcase Section ---- */}
      <section className="dcs-showcase-section">
        <div className="section-container">
          {/* Section Introduction */}
          <div className="section-heading-block dcs-section-header">
            <span className="section-label">{le?.showcaseLabel || "Dementia Care Series (DCS)"}</span>
            <h2>{le?.showcaseTitle || "Choose Your Learning Pathway"}</h2>
            <p>
              {le?.showcaseDesc || "Select your role category below to view tailored in-person training curriculum, scheduled dates, and registration details."}
            </p>
          </div>

          {/* Interactive 3-Track Tab Switcher */}
          <div
            className="dcs-tab-selector"
            role="tablist"
            aria-label="Dementia Care Series Learning Tracks"
          >
            {physicalProgrammes.map((p) => {
              const isActive = activeTrackId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  id={`tab-${p.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${p.id}`}
                  className={`dcs-tab-card ${isActive ? "is-active" : ""} tab-${p.id}`}
                  onClick={() => setActiveTrackId(p.id)}
                >
                  <div className="tab-card-header">
                    <span className="tab-track-badge">{p.trackNumber}</span>
                    <span className="tab-status-chip">{p.badge}</span>
                  </div>
                  <h3 className="tab-card-title">{p.code}</h3>
                  <p className="tab-card-subtitle">{p.roleCategory}</p>
                  <div className="tab-active-indicator" aria-hidden="true" />
                </button>
              );
            })}
          </div>

          {/* Active Track Stage */}
          <div
            key={activeTrack.id}
            id={`panel-${activeTrack.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTrack.id}`}
            className={`dcs-active-stage dcs-stage-${activeTrack.id}`}
          >
            {/* Stage Header Banner */}
            <div className="stage-header">
              <div className="stage-header-meta">
                <span className="stage-track-pill">{activeTrack.trackNumber}</span>
                <span className="stage-role-pill">{activeTrack.roleCategory}</span>
                <span className="stage-status-pill">{activeTrack.badge}</span>
              </div>
              <h3 className="stage-title">{activeTrack.title}</h3>

              {/* Purpose Quote */}
              <div className="stage-quote-box">
                <div className="stage-quote-mark" aria-hidden="true">&ldquo;</div>
                <blockquote>{activeTrack.shortIntro}</blockquote>
              </div>
            </div>

            {/* Stage Body Grid */}
            <div className="stage-grid">
              {/* Left Column: Who it's for, Highlights & Actions */}
              <div className="stage-col-main">
                {/* Suitable For */}
                <div className="stage-info-card">
                  <h4>
                    <span className="info-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </span>
                    {le?.whoDesignedFor || "Who this is designed for"}
                  </h4>
                  <p className="stage-suitable-text">{activeTrack.suitableFor}</p>
                </div>

                {/* Key Learning Pillars or Pathway Steps */}
                <div className="stage-info-card">
                  <h4>
                    <span className="info-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </span>
                    {activeTrack.id === "dcs-ttt"
                      ? (le?.accreditationMilestones || "Accreditation Pathway Milestones")
                      : (le?.corePillars || "Core Learning Pillars & Competencies")}
                  </h4>

                  {activeTrack.id === "dcs-ttt" ? (
                    <div className="stage-pathway-steps">
                      {(le?.stageSpecs?.accreditationSteps || [
                        { title: "Application & Eligibility Review", desc: "Review of healthcare, educator, or senior community leadership background." },
                        { title: "6 Full-Day Intensive Modules", desc: "Curriculum mastery, facilitation psychology, staging nuances, and governance." },
                        { title: "Supervised Mock Teaching", desc: "Clinical observation, peer feedback, and rigorous delivery assessment." },
                        { title: "Accreditation & Profile Listing", desc: "Award of RCBC Certified Trainer credential with public directory listing." }
                      ]).map((step, idx) => (
                        <div className="stage-step-row" key={idx}>
                          <span className="step-num">{idx + 1}</span>
                          <div>
                            <strong>{step.title}</strong>
                            <p>{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="stage-pillars-list">
                      {activeTrack.highlights.map((h, i) => (
                        <li key={i}>
                          <span className="pillar-check" aria-hidden="true">✓</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Actions */}
                <div className="stage-actions-row">
                  <button
                    type="button"
                    className="stage-btn-primary"
                    onClick={() => setActiveModalProgram(activeTrack)}
                  >
                    {activeTrack.buttonLabel} <span aria-hidden="true">→</span>
                  </button>

                  {activeTrack.id === "dcs-family" && (
                    <Link
                      to="/learn-events/upcoming-calendar"
                      className="stage-btn-secondary"
                      title="View DCS-Family in Upcoming Calendar"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                      </svg>
                      {le?.viewInUpcomingCalendar || "View in Upcoming Calendar"}
                    </Link>
                  )}

                  {activeTrack.id === "dcs-ttt" && (
                    <Link
                      to="/learn-events/certified-trainers"
                      className="stage-btn-secondary"
                      title="Explore Certified Trainers Directory"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {le?.viewCertifiedTrainers || "View Certified Trainers Directory"}
                    </Link>
                  )}

                  {activeTrack.id === "dcs-care-worker" && (
                    <button
                      type="button"
                      className="stage-btn-secondary"
                      onClick={() => alert("The detailed DCS-Care Worker curriculum framework is currently being finalized with clinical partners. Register on the waitlist to receive the full syllabus upon release.")}
                      title="View curriculum syllabus overview"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      {le?.curriculumOverview || "Curriculum Overview"}
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Specifications & Visual Media */}
              <div className="stage-col-side">
                {/* Specifications Card */}
                <div className="stage-spec-card">
                  <h4 className="spec-card-title">{le?.programDetailsSchedule || "Programme Details & Schedule"}</h4>
                  <dl className="stage-spec-list">
                    <div>
                      <dt>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {le?.modeLabel || "Mode"}
                      </dt>
                      <dd>
                        <span className="stage-mode-pill">{activeTrack.mode}</span>
                      </dd>
                    </div>

                    <div>
                      <dt>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                        {le?.sessionsLabel || "Sessions"}
                      </dt>
                      <dd>{activeTrack.sessions}</dd>
                    </div>

                    <div>
                      <dt>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" x2="22" y1="12" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        {le?.languageLabel || "Language"}
                      </dt>
                      <dd>{activeTrack.language}</dd>
                    </div>

                    <div>
                      <dt>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {le?.locationLabel || "Location"}
                      </dt>
                      <dd>{activeTrack.location}</dd>
                    </div>

                    <div className="spec-schedule-block">
                      <dt>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        {le?.nextScheduledDateTime || "Next Scheduled Date & Time"}
                      </dt>
                      <dd className="spec-schedule-value">
                        <strong>{activeTrack.schedule.date}</strong>
                        <span>{activeTrack.schedule.time}</span>
                        {activeTrack.schedule.calendarActivityId && (
                          <small className="spec-calendar-badge">
                            Linked to Upcoming Calendar Activity #{activeTrack.schedule.calendarActivityId}
                          </small>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Media Preview Card */}
                <div className="stage-media-card">
                  <img
                    src={trackImages[activeTrack.id] || dcsFamilyImage}
                    alt={activeTrack.title}
                  />
                  <div className="stage-media-caption">
                    {activeTrack.id === "dcs-family" && (le?.stageSpecs?.captions?.family || "Delivered in person by RCBC Certified Trainers in small, compassionate cohorts.")}
                    {activeTrack.id === "dcs-ttt" && (le?.stageSpecs?.captions?.ttt || "Training is the programme. Certification is the outcome that empowers Sarawak.")}
                    {activeTrack.id === "dcs-care-worker" && (le?.stageSpecs?.captions?.careWorker || "Mastering clinical BPSD protocols, distress communication, and safe handling.")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reusable Program Modal (createPortal) */}
      {activeModalProgram && (
        <ProgramModal
          program={activeModalProgram}
          onClose={() => setActiveModalProgram(null)}
        />
      )}
    </main>
  );
}

/* ================================================================
   IMAGE LIGHTBOX MODAL
   Reusable modal for zooming and inspecting posters, news, and photos
   ================================================================ */
function ImageLightboxModal({ isOpen, onClose, image, title, subtitle, caption, date }) {
  const dialogRef = useRef(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    dialogRef.current?.focus({ preventScroll: true });
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !image) return null;

  return createPortal(
    <div
      className="modal-backdrop lightbox-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="lightbox-modal-content"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Image viewer"}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="lightbox-header">
          <div className="lightbox-titles">
            {subtitle && <span className="lightbox-badge">{subtitle}</span>}
            <h3>{title}</h3>
            {date && <span className="lightbox-date">{date}</span>}
          </div>
          <div className="lightbox-ctrls">
            <button
              type="button"
              className="lightbox-action-btn"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              {isZoomed ? "🔍 Fit to Screen" : "🔍 Zoom In"}
            </button>
            <a
              href={image}
              target="_blank"
              rel="noreferrer"
              className="lightbox-action-btn"
            >
              ↗ Open Original
            </a>
            <button
              type="button"
              className="modal-close lightbox-close-btn"
              onClick={onClose}
              aria-label="Close image viewer"
            >
              &times;
            </button>
          </div>
        </div>

        <div className={`lightbox-viewport ${isZoomed ? "is-zoomed" : ""}`}>
          <img
            src={image}
            alt={title || "Preview"}
            onClick={() => setIsZoomed(!isZoomed)}
          />
        </div>

        {caption && (
          <div className="lightbox-footer">
            <p>{caption}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}



/* ================================================================
   FACILITATOR PROFILE MODAL
   Complete verified public profile matching client requirements:
   Name | Cert Ref No | Location | Language | Bio | Approved Activities
   ================================================================ */
function FacilitatorProfileModal({ facilitator, activities = [], onClose }) {
  const { t } = useLanguage();
  const le = t.learnEvents;
  const fm = le?.facilitatorModal || {};
  const am = le?.activityModal || {};
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'upcoming' | 'completed'

  useEffect(() => {
    if (!facilitator) return undefined;
    dialogRef.current?.focus({ preventScroll: true });
    const handleKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [facilitator, onClose]);

  if (!facilitator) return null;

  const trainerActivities = activities.filter((a) => (a.trainerId === facilitator.id || a.trainers?.some(t => t.trainerId === facilitator.id)));
  const upcomingActs = trainerActivities.filter((a) => a.status === "upcoming");
  const pastActs = trainerActivities.filter((a) => a.status === "completed");

  const filteredActs =
    activeTab === "upcoming"
      ? upcomingActs
      : activeTab === "completed"
        ? pastActs
        : trainerActivities;

  const isAdvisory = facilitator.category === "advisory-support";

  return createPortal(
    <div
      className="modal-backdrop facilitator-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="facilitator-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="facilitator-modal-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <button
          className="modal-close facilitator-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close facilitator profile"
        >
          &times;
        </button>

        {/* Modal Top Header with verified badge */}
        <div className="facilitator-modal-hero">
          <div
            className="facilitator-modal-avatar"
            style={{ backgroundColor: facilitator.badgeColor || "#0d716b" }}
          >
            <span>{facilitator.initials || facilitator.name.charAt(0)}</span>
            <span className="facilitator-modal-verified-badge" title="ADFM Credentialed Facilitator">
              ✓
            </span>
          </div>

          <div className="facilitator-modal-hero-text">
            <div className="facilitator-modal-category-row">
              <span className={`facilitator-category-pill ${isAdvisory ? "is-advisory" : "is-clinical"}`}>
                {isAdvisory ? "ADFM QA/QC Advisory Board" : "Certified Clinical Facilitator"}
              </span>
            </div>

            <h2 id="facilitator-modal-title">{facilitator.name}</h2>
            <p className="facilitator-modal-role">
              <strong>{facilitator.role}</strong> &bull; {facilitator.institution}
            </p>

            <div className="facilitator-modal-meta-grid">
              <div className="modal-meta-item">
                <span className="meta-label">{fm.baseLocation || "Base Location"}</span>
                <span className="meta-value">📍 {facilitator.city}</span>
              </div>
              <div className="modal-meta-item">
                <span className="meta-label">{fm.languagesSpoken || "Languages Spoken"}</span>
                <span className="meta-value">🌐 {facilitator.language}</span>
              </div>
              <div className="modal-meta-item">
                <span className="meta-label">{fm.adfmAccreditation || "ADFM Accreditation"}</span>
                <span className="meta-value">🛡️ DCS-TTT Framework</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="facilitator-modal-body">
          {/* Biography & Delivery Scope */}
          <div className="facilitator-bio-section">
            <h3>{fm.bioScope || "Facilitator Biography & Practice Scope"}</h3>
            <p>{facilitator.bio}</p>
          </div>

          {/* Activities Segment */}
          <div className="facilitator-activities-section">
            <div className="activities-section-header">
              <div>
                <h3>{fm.approvedActivities || "Approved Education Activities"} ({trainerActivities.length})</h3>
                <p>Public webinars, community dialogue circles, and clinical training sessions led by this facilitator.</p>
              </div>

              {/* Segmented Filter Pills */}
              <div className="modal-activities-filter-pills" role="tablist">
                <button
                  type="button"
                  className={`modal-filter-pill ${activeTab === "all" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  All ({trainerActivities.length})
                </button>
                <button
                  type="button"
                  className={`modal-filter-pill ${activeTab === "upcoming" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("upcoming")}
                >
                  Upcoming ({upcomingActs.length})
                </button>
                <button
                  type="button"
                  className={`modal-filter-pill ${activeTab === "completed" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("completed")}
                >
                  Past &amp; Archive ({pastActs.length})
                </button>
              </div>
            </div>

            {filteredActs.length > 0 ? (
              <div className="modal-activities-list">
                {filteredActs.map((act) => (
                  <div className="modal-activity-card" key={act.id}>
                    <div className="modal-act-left">
                      <div className="modal-act-badges">
                        <span className="act-type-tag">{act.type}</span>
                        <StatusBadge status={act.status} />
                      </div>
                      <h4>{act.title}</h4>
                      <p className="modal-act-desc">{act.description}</p>
                      <div className="modal-act-meta">
                        <span>📅 {act.date}</span>
                        {act.time && <span>⏰ {act.time}</span>}
                        <span>📍 {act.location}</span>
                        <span>🌐 {act.language}</span>
                      </div>
                    </div>

                    <div className="modal-act-right">
                      {act.status === "upcoming" ? (
                        <a
                          href={act.registrationLink || "https://forms.google.com/"}
                          target="_blank"
                          rel="noreferrer"
                          className="modal-act-register-btn"
                        >
                          {am.registerNow || "Register Now"} ↗
                        </a>
                      ) : (
                        <div className="modal-act-archived-info">
                          <span className="archived-pill">{le?.completed || "Completed"}</span>
                          {act.materials && <small>{act.materials}</small>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="modal-activities-empty">
                <p>No {activeTab} approved education activities recorded under this category.</p>
              </div>
            )}
          </div>

          {/* Explicit Boundary Notice */}
          <div className="facilitator-modal-boundary-box">
            <span className="boundary-icon">🛡️</span>
            <div>
              <strong>Boundary &amp; Governance Notice:</strong>
              <p>
                Certified Trainer status reflects the defined project training and certification scope under
                the Rotary HopeCare &amp; Alzheimer's Disease Foundation Malaysia (ADFM) DCS-TTT initiative.
                It should not be presented or construed as a broader professional endorsement or guarantee.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="facilitator-modal-footer">
          <a
            href="https://forms.google.com/"
            target="_blank"
            rel="noreferrer"
            className="primary-button"
          >
            {le?.requestFacilitator || "Request Facilitator for Community Session ↗"}
          </a>
          <button type="button" className="btn-secondary" onClick={onClose}>
            {le?.closeProfile || "Close Profile"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ================================================================
   SECTION 3: EVENTS (Restored & Supercharged with Dialogue, Calendar, News)
   ================================================================ */
function EventsSection() {
  const { t } = useLanguage();
  const le = t.learnEvents;
  const ev = le?.eventsSection || {};
  const activities = usePublicActivities();
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [lightboxData, setLightboxData] = useState(null);

  // Multi-calendar roadmap datasets
  const roadmaps = [
    {
      id: "2026-half-1",
      editionLabel: "2026 (1st Half)",
      title: '1st Half Yearly Activity Calendar: "Finding The Missing Pieces"',
      theme: "Finding The Missing Pieces",
      period: "January 2026 – June 2026",
      intro: "Official calendar published by Rotary Club of Bintulu Central and ADFM, featuring key public webinars and dementia care skills training.",
      poster: yearlyCalendar2026Poster,
      highlights: [
        {
          num: "01",
          phase: "11 April 2026",
          title: "Webinar – Season 1 (Online)",
          desc: "Online interactive session (80 minutes) focusing on understanding dementia and finding the missing pieces of community care.",
          tag: "Webinar",
          dotClass: "dot-1",
        },
        {
          num: "02",
          phase: "16 May 2026",
          title: "Basic Dementia Care Skill (Family) Course (DCS-Family)",
          desc: "Full-day training (9:00 AM – 6:00 PM) at Hock Lee Hotel & Residence, Kuching, equipping 100 family caregivers with practical bedside care skills.",
          tag: "Kuching",
          dotClass: "dot-2",
        },
        {
          num: "03",
          phase: "26 – 28 June 2026",
          title: "Dementia Care Skill – Train the Trainer Program (DCS-TTT)",
          desc: "Three-day comprehensive Train-the-Trainer program in Kuching to expand the cadre of certified ADFM trainers across Sarawak.",
          tag: "TTT Program",
          dotClass: "dot-3",
        },
      ],
    },
    {
      id: "2024-2025-ttt",
      editionLabel: "2024–2025 Milestones",
      title: 'DCS-TTT State-Wide Rollout: "68 Healthcare Workers Trained"',
      theme: "Empowering Sarawak Healthcare Frontliners",
      period: "November 2024 – November 2025",
      intro: "Four completed cohorts of Dementia Care Skill Train-the-Trainer (DCS-TTT) programs across Sarawak documented in See Hua and Sin Chew Daily news.",
      poster: yearlyCalendar2026Poster,
      highlights: [
        {
          num: "01",
          phase: "Nov 2024 & May 2025",
          title: "Cohorts 1 & 2: Kuching & Sibu",
          desc: "First 18 medical personnel trained in Kuching, followed by Cohort 2 in Sibu to build regional dementia care competence.",
          tag: "Kuching & Sibu",
          dotClass: "dot-1",
        },
        {
          num: "02",
          phase: "16 August 2025",
          title: "Cohort 3 & Bintulu Community Dialogue",
          desc: "DCS-TTT training in Bintulu paired with a large-scale public dialogue on dementia at Bintulu Civic Centre with local community leaders.",
          tag: "Bintulu",
          dotClass: "dot-2",
        },
        {
          num: "03",
          phase: "November 2025",
          title: "Cohort 4: Miri (68 Total Certified)",
          desc: "Final cohort of the initial phase conducted in Miri, successfully certifying 68 doctors, nurses, and allied healthcare professionals.",
          tag: "Miri",
          dotClass: "dot-3",
        },
      ],
    },
    {
      id: "adfm-curriculum",
      editionLabel: "ADFM & Rotary Framework",
      title: 'Community Support Ecosystem: "Structured Care Pathways"',
      theme: "Certified Training & Public Advocacy",
      period: "Ongoing Initiative",
      intro: "Collaborative mission between Rotary Club of Bintulu Central and Alzheimer’s Disease Foundation Malaysia (ADFM) to deliver certified dementia care education.",
      poster: yearlyCalendar2026Poster,
      highlights: [
        {
          num: "01",
          phase: "ADFM Certified Trainers",
          title: "9 Certified Trainers & 3 QA/QC Specialists",
          desc: "Multidisciplinary team of certified clinical trainers delivering evidence-based dementia care modules with official CPD accreditation.",
          tag: "Faculty",
          dotClass: "dot-1",
        },
        {
          num: "02",
          phase: "DCS-Family Curriculum",
          title: "6 Core Modules for Family Caregivers",
          desc: "From understanding neurocognitive disorders and communication to behaviour management, daily living activities, and caregiver self-care.",
          tag: "Curriculum",
          dotClass: "dot-2",
        },
        {
          num: "03",
          phase: "Community & Dialect Outreach",
          title: "Multilingual Community Dialogues",
          desc: "Engaging local Sarawakian families in English, Bahasa Melayu, and Chinese dialects to eliminate stigma and foster supportive networks.",
          tag: "Outreach",
          dotClass: "dot-3",
        },
      ],
    },
  ];

  // Carousel state
  const [activeRoadmapIndex, setActiveRoadmapIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState("next"); // 'next' | 'prev'
  const [isAnimating, setIsAnimating] = useState(false);

  const currentRoadmap = roadmaps[activeRoadmapIndex];

  const handlePrevRoadmap = () => {
    if (isAnimating) return;
    setSlideDirection("prev");
    setIsAnimating(true);
    setActiveRoadmapIndex((prev) => (prev === 0 ? roadmaps.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handleNextRoadmap = () => {
    if (isAnimating) return;
    setSlideDirection("next");
    setIsAnimating(true);
    setActiveRoadmapIndex((prev) => (prev === roadmaps.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handleSelectRoadmap = (idx) => {
    if (idx === activeRoadmapIndex || isAnimating) return;
    setSlideDirection(idx > activeRoadmapIndex ? "next" : "prev");
    setIsAnimating(true);
    setActiveRoadmapIndex(idx);
    setTimeout(() => setIsAnimating(false), 400);
  };

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All cities");
  const [selectedFormat, setSelectedFormat] = useState("All formats");
  const [selectedLanguage, setSelectedLanguage] = useState("All languages");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'upcoming', 'completed'

  // Format list for filtering
  const eventFormats = ["All formats", "Dialogue", "Expo", "Forum", "Workshop", "Public Talk"];

  // Filtered community activities
  const filteredEvents = useMemo(() => {
    return activities.filter((ev) => {
      // Must be a community event type (Dialogue, Expo, Forum, Workshop, Public Talk, Other)
      const isCommunityEvent = ["Dialogue", "Expo", "Forum", "Workshop", "Seminar", "Public Talk", "Other"].includes(ev.type);
      if (!isCommunityEvent) return false;

      // Status filter
      if (statusFilter === "upcoming" && ev.status !== "upcoming") return false;
      if (statusFilter === "completed" && ev.status !== "completed") return false;

      // City filter
      if (selectedCity !== "All cities") {
        const matchesCity = ev.city === selectedCity || (ev.location && ev.location.includes(selectedCity));
        if (!matchesCity) return false;
      }

      // Format filter
      if (selectedFormat !== "All formats" && ev.type !== selectedFormat) return false;

      // Language filter
      if (selectedLanguage !== "All languages") {
        if (!ev.language || !ev.language.includes(selectedLanguage)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const text = `${ev.title} ${ev.description} ${ev.location} ${ev.speaker} ${ev.type}`.toLowerCase();
        if (!text.includes(searchQuery.toLowerCase().trim())) return false;
      }

      return true;
    });
  }, [activities, searchQuery, selectedCity, selectedFormat, selectedLanguage, statusFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCity !== "All cities" ||
    selectedFormat !== "All formats" ||
    selectedLanguage !== "All languages" ||
    statusFilter !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCity("All cities");
    setSelectedFormat("All formats");
    setSelectedLanguage("All languages");
    setStatusFilter("all");
  };

  return (
    <main className="module-main events-experience-module">
      {/* ---- Interactive Jump Bar ---- */}
      <section className="events-subnav-section">
        <div className="section-container">
          <div className="events-subnav-bar">
            <span className="subnav-label">{le?.jumpTo || "Jump to Section:"}</span>
            <div className="subnav-pills">
              <a href="#yearly-calendar" className="subnav-pill">
                <span className="subnav-icon">📅</span> {le?.yearlyCal || "Yearly Activity Calendar"}
              </a>
              <a href="#community-dialogues" className="subnav-pill">
                <span className="subnav-icon">🗣️</span> {le?.communityDial || "Community Dialogues"}
              </a>
              <a href="#event-finder" className="subnav-pill">
                <span className="subnav-icon">🔍</span> {le?.communityEvents || "Event Finder & Filters"}
              </a>
              <a href="#media-coverage" className="subnav-pill">
                <span className="subnav-icon">📰</span> {ev.mediaHeadlines || le?.pressHighlights || "Press & Media Highlights"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Section 1: Yearly Activity Calendar (Clean & Modern Interactive Showcase) ---- */}
      <section id="yearly-calendar" className="events-feature-section yearly-calendar-section">
        <div className="section-container">
          {/* Header & Switcher Row */}
          <div className="yearly-calendar-header-row">
            <div className="events-section-header">
              <span className="section-label">{ev.roadmapLabel || "Annual Activity Roadmap"}</span>
              <h2>{currentRoadmap.title}</h2>
              <p>{currentRoadmap.intro}</p>
            </div>

            {/* Clean Segmented Calendar Switcher */}
            <div className="calendar-switcher-dock" aria-label="Select calendar edition">
              <div className="switcher-pills" role="tablist">
                {roadmaps.map((rm, idx) => (
                  <button
                    key={rm.id}
                    type="button"
                    className={`switcher-pill-btn ${idx === activeRoadmapIndex ? "is-active" : ""}`}
                    onClick={() => handleSelectRoadmap(idx)}
                    role="tab"
                    aria-selected={idx === activeRoadmapIndex}
                  >
                    {rm.editionLabel}
                  </button>
                ))}
              </div>

              <div className="switcher-nav-arrows">
                <button
                  type="button"
                  className="switcher-arrow-btn"
                  onClick={handlePrevRoadmap}
                  aria-label="Previous calendar edition"
                  title="Previous calendar edition"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <div className="switcher-counter-pill">
                  <span className="switcher-count-num">{activeRoadmapIndex + 1}</span>
                  <span className="switcher-count-sep">/</span>
                  <span className="switcher-count-total">{roadmaps.length}</span>
                </div>

                <button
                  type="button"
                  className="switcher-arrow-btn"
                  onClick={handleNextRoadmap}
                  aria-label="Next calendar edition"
                  title="Next calendar edition"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Animated Multi-Calendar Showcase Grid */}
          <div
            className={`yearly-calendar-showcase-grid ${slideDirection === "next" ? "slide-from-right" : "slide-from-left"
              }`}
            key={currentRoadmap.id}
          >
            {/* Visual Poster Card */}
            <div
              className="calendar-poster-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                setLightboxData({
                  image: currentRoadmap.poster,
                  title: currentRoadmap.title,
                  subtitle: `${currentRoadmap.theme} — Annual Roadmap`,
                  caption: `${currentRoadmap.title} (${currentRoadmap.period}). Official activity roadmap delivered by Rotary Club of Bintulu Central and partner organisations across Sarawak.`,
                  date: currentRoadmap.period,
                })
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                setLightboxData({
                  image: currentRoadmap.poster,
                  title: currentRoadmap.title,
                  subtitle: `${currentRoadmap.theme} — Annual Roadmap`,
                  caption: `${currentRoadmap.title} (${currentRoadmap.period}).`,
                  date: currentRoadmap.period,
                })
              }
            >
              <div className="calendar-poster-thumb-wrap">
                <img
                  src={currentRoadmap.poster}
                  alt={currentRoadmap.title}
                  className="calendar-poster-img"
                />
                <div className="calendar-poster-hover-overlay">
                  <span className="poster-zoom-pill">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                    <span>{le?.eventsSection?.clickFullscreen || "Click to View Fullscreen"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Milestones Side Panel */}
            <div className="calendar-milestones-panel">
              <div className="milestones-heading">
                <div className="milestones-heading-badge-row">
                  <span className="milestones-period-tag">{currentRoadmap.period}</span>
                  <span className="milestones-theme-tag">&ldquo;{currentRoadmap.theme}&rdquo;</span>
                </div>
                <h3>{ev.roadmapHighlights || "Key Roadmap Highlights"}</h3>
                <p>{ev.roadmapSubtitle || "Scheduled phases for community outreach, family workshops, and public education:"}</p>
              </div>

              {/* Connected Milestone Track */}
              <div className="milestones-stepper-track">
                <div className="stepper-line" aria-hidden="true" />
                {currentRoadmap.highlights.map((hl) => (
                  <div className="stepper-item" key={hl.num}>
                    <div className={`stepper-node ${hl.dotClass}`}>
                      <span>{hl.num}</span>
                    </div>
                    <div className="stepper-card">
                      <div className="stepper-header-row">
                        <span className="stepper-phase">{hl.phase}</span>
                        <span className="stepper-tag">{hl.tag}</span>
                      </div>
                      <h4 className="stepper-title">{hl.title}</h4>
                      <p className="stepper-desc">{hl.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons Bar */}
              <div className="calendar-quick-actions">
                <button
                  type="button"
                  className="calendar-primary-btn"
                  onClick={() =>
                    setLightboxData({
                      image: currentRoadmap.poster,
                      title: currentRoadmap.title,
                      subtitle: `${currentRoadmap.theme} — Annual Roadmap`,
                      caption: "Full resolution calendar roadmap for community download and printing.",
                      date: currentRoadmap.period,
                    })
                  }
                >
                  <span className="btn-icon">🔍</span> Inspect Full Calendar Poster ↗
                </button>
                <a href="#event-finder" className="calendar-secondary-btn">
                  <span className="btn-icon">↓</span> {ev.browseSchedule || "Browse Event Schedule Below"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Section 2: Community Outreach Showcase (Sibu Batch 2 TTT) ---- */}
      <section id="community-dialogues" className="events-feature-section dialogues-showcase-section">
        <div className="section-container">
          <div className="events-section-header">
            <span className="section-label">{ev.communityOutreach || "Community Outreach"}</span>
            <h2>{ev.sibuBatch2Title || "Alzheimer’s Care Project: TTT Batch 2 in Sibu"}</h2>
            <p>
              {ev.sibuBatch2Desc || "Back in May, our Batch 2 TTT in Sibu brought together a group of passionate participants from Kapit, Betong, and Sibu, who dedicated three days to learning, practicing, and preparing to serve their communities."}
            </p>
          </div>

          {/* Dialogue Photo Gallery */}
          <div className="dialogues-gallery-grid">
            <article
              className="dialogue-photo-card"
              onClick={() =>
                setLightboxData({
                  image: dialogueImg1,
                  title: "Alzheimer’s Care Project TTT Batch 2 — Sibu, Sarawak",
                  subtitle: "Sibu, Sarawak (16/5/25 – 18/5/25)",
                  caption:
                    "Back in May, our Batch 2 TTT in Sibu brought together a group of passionate participants from Kapit, Betong, Sibu, who dedicated three days to learning, practicing, and preparing to serve their communities.",
                  date: "16–18 May 2025",
                })
              }
            >
              <div className="dialogue-img-wrap">
                <img src={dialogueImg1} alt="Alzheimer's Care Project TTT Batch 2 Sibu, Sarawak (16/5/25 - 18/5/25)" />
                <span className="dialogue-tag">Sibu, Sarawak</span>
                <div className="dialogue-hover-btn">
                  <span>{le?.eventsSection?.viewPhoto || "🔍 View Photo"}</span>
                </div>
              </div>
              <div className="dialogue-card-body">
                <h3>{le?.eventsSection?.photo1Title || "Alzheimer’s Care Project TTT Batch 2 (16/5/25 – 18/5/25)"}</h3>
                <p>
                  Participants from Kapit, Betong, and Sibu dedicated three days to learning, practicing,
                  and preparing to serve their communities with evidence-based dementia care skills.
                </p>
                <span className="dialogue-date">📅 16–18 May 2025 · Sibu, Sarawak</span>
              </div>
            </article>

            <article
              className="dialogue-photo-card"
              onClick={() =>
                setLightboxData({
                  image: dialogueImg2,
                  title: "Living Impact & Growing Caregiver Support — Sibu, Sarawak",
                  subtitle: "Sibu, Sarawak (16/5/25 – 18/5/25)",
                  caption:
                    "Although months have passed, the impact, memories, and lessons from Sibu remain very much alive. What was planted then has continued to grow, in the way trainers share their knowledge, in the way caregivers feel supported, and in the way communities begin to open their hearts toward dementia care. Batch 2 was not just an event in May; it is a living part of our journey, shaping what we do today and reminding us that every step matters in building a dementia-friendly Sarawak.",
                  date: "16–18 May 2025",
                })
              }
            >
              <div className="dialogue-img-wrap">
                <img src={dialogueImg2} alt="TTT Batch 2 Interactive Learning & Practice Sibu (16/5/25 - 18/5/25)" />
                <span className="dialogue-tag">Sibu, Sarawak</span>
                <div className="dialogue-hover-btn">
                  <span>{le?.eventsSection?.viewPhoto || "🔍 View Photo"}</span>
                </div>
              </div>
              <div className="dialogue-card-body">
                <h3>{le?.eventsSection?.photo2Title || "Living Impact & Growing Caregiver Support"}</h3>
                <p>
                  Although months have passed, the impact, memories, and lessons from Sibu remain very much alive in the way trainers share their knowledge, caregivers feel supported, and communities open their hearts toward dementia care.
                </p>
                <span className="dialogue-date">📅 16–18 May 2025 · Sibu, Sarawak</span>
              </div>
            </article>
          </div>

          {/* Dialogue Three Core Pillars */}
          <div className="dialogue-pillars-grid">
            <div className="dialogue-pillar-card">
              <div className="pillar-icon">🌱</div>
              <h4>{ev.pillar1Title || "Kapit, Betong & Sibu"}</h4>
              <p>
                {ev.pillar1Desc || "Uniting dedicated participants from across divisions who committed three days of intensive learning, roleplays, and community preparation."}
              </p>
            </div>
            <div className="dialogue-pillar-card">
              <div className="pillar-icon">🤝</div>
              <h4>{ev.pillar2Title || "Enduring Grassroots Support"}</h4>
              <p>
                {ev.pillar2Desc || "What was planted in Sibu continues to grow in the way trainers share their knowledge and family caregivers feel genuinely supported."}
              </p>
            </div>
            <div className="dialogue-pillar-card">
              <div className="pillar-icon">🏛️</div>
              <h4>{ev.pillar3Title || "A Living Journey"}</h4>
              <p>
                {ev.pillar3Desc || "Batch 2 is not just a past event; it is a living part of our journey shaping what we do today in building a dementia-friendly Sarawak."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Section 3: Interactive Event Finder & Filter Bar ---- */}
      <section id="event-finder" className="events-feature-section event-finder-section">
        <div className="section-container">
          <div className="events-section-header">
            <span className="section-label">{ev.findRegisterEyebrow || "Find & Register"}</span>
            <h2>{ev.exploreTitle || "Explore Community Events & Workshops"}</h2>
            <p>
              {ev.exploreDesc || "Filter through public dialogues, regional care expos, educational workshops, and forums across Sarawak. Click any card to view details or register externally."}
            </p>
          </div>

          {/* Interactive Filter Bar */}
          <div className="event-finder-bar">
            {/* Search Input */}
            <div className="finder-search-field">
              <span className="finder-search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                placeholder={le?.eventsSection?.searchPlaceholder || "Search events by title, venue, city, or speaker..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search events"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="finder-clear-input"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search input"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Filter Selects & Controls */}
            <div className="finder-controls-row">
              <div className="finder-select-wrap">
                <label htmlFor="city-filter-select" className="sr-only">{ev.filterCity || "Filter by city"}</label>
                <select
                  id="city-filter-select"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option>{ev.allCities || "All cities"}</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="finder-select-wrap">
                <label htmlFor="format-filter-select" className="sr-only">{ev.filterFormat || "Filter by format"}</label>
                <select
                  id="format-filter-select"
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                >
                  {eventFormats.map((fmt) => (
                    <option key={fmt} value={fmt}>{fmt}</option>
                  ))}
                </select>
              </div>

              <div className="finder-select-wrap">
                <label htmlFor="lang-filter-select" className="sr-only">{ev.filterLanguage || "Filter by language"}</label>
                <select
                  id="lang-filter-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  <option>{ev.allLanguages || "All languages"}</option>
                  {languages.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Status Toggle Pills */}
              <div className="finder-status-pills">
                <button
                  type="button"
                  className={`status-pill ${statusFilter === "all" ? "active" : ""}`}
                  onClick={() => setStatusFilter("all")}
                >
                  {ev.all || "All"}
                </button>
                <button
                  type="button"
                  className={`status-pill ${statusFilter === "upcoming" ? "active" : ""}`}
                  onClick={() => setStatusFilter("upcoming")}
                >
                  {ev.upcoming || "Upcoming"}
                </button>
                <button
                  type="button"
                  className={`status-pill ${statusFilter === "completed" ? "active" : ""}`}
                  onClick={() => setStatusFilter("completed")}
                >
                  {ev.past || "Past"}
                </button>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="finder-reset-btn"
                  onClick={clearAllFilters}
                >
                  {ev.resetFilters || "Reset Filters"}
                </button>
              )}
            </div>
          </div>

          {/* Results Summary Counter */}
          <div className="finder-results-counter">
            <span className="counter-badge">
              {le?.eventsSection?.eventsFound ? le.eventsSection.eventsFound.replace('{count}', filteredEvents.length).replace('{plural}', filteredEvents.length === 1 ? '' : 's') : `${filteredEvents.length} event${filteredEvents.length === 1 ? '' : 's'} found`}
            </span>
            {hasActiveFilters && (
              <span className="active-filters-hint">
                Filtering by {selectedCity !== "All cities" && `City: ${selectedCity} `}
                {selectedFormat !== "All formats" && `Format: ${selectedFormat} `}
                {statusFilter !== "all" && `Status: ${statusFilter}`}
              </span>
            )}
          </div>

          {/* Events Grid */}
          {filteredEvents.length > 0 ? (
            <div className="events-cards-grid">
              {filteredEvents.map((event) => (
                <article className="rich-event-card" key={event.id}>
                  <div className="event-card-header">
                    <div className="event-card-thumb-wrap">
                      <img src={eventImage} alt="" className="event-card-thumb" />
                      <div className="event-thumb-overlay" />
                    </div>
                    <div className="event-card-badges">
                      <span className="event-type-badge">{event.type}</span>
                      <StatusBadge status={event.status} />
                    </div>
                  </div>

                  <div className="event-card-body">
                    <h3 className="event-card-title">{event.title}</h3>
                    <p className="event-card-desc">{event.description}</p>

                    <div className="event-meta-list">
                      <div className="event-meta-item">
                        <span className="meta-icon">📅</span>
                        <span>{event.date}</span>
                      </div>
                      <div className="event-meta-item">
                        <span className="meta-icon">⏰</span>
                        <span>{event.time}</span>
                      </div>
                      <div className="event-meta-item">
                        <span className="meta-icon">📍</span>
                        <span>{event.location}</span>
                      </div>
                      <div className="event-meta-item">
                        <span className="meta-icon">🌐</span>
                        <span>{event.language}</span>
                      </div>
                      {event.speaker && (
                        <div className="event-meta-item">
                          <span className="meta-icon">👤</span>
                          <span>{event.speaker}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="event-card-footer">
                    {event.status === "upcoming" ? (
                      <a
                        href={event.registrationLink || "https://forms.google.com/"}
                        target="_blank"
                        rel="noreferrer"
                        className="event-register-btn"
                      >
                        {ev.registerGoogleForm || "Register via Google Form ↗"}
                      </a>
                    ) : (
                      <span className="event-completed-tag">{ev.sessionCompleted || "Session Completed"}</span>
                    )}
                    <button
                      type="button"
                      className="event-details-btn"
                      onClick={() => setSelectedActivity(event)}
                    >
                      {ev.viewDetails || "View Details"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="events-empty-state">
              <span className="empty-icon">🔍</span>
              <h3>{ev.noMatchingEvents || "No matching events found"}</h3>
              <p>{ev.noMatchingDesc || "We couldn't find any events matching your selected search query or filters."}</p>
              <button type="button" className="primary-button" onClick={clearAllFilters}>
                {ev.clearAllFilters || "Clear All Filters"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ---- Section 4: Sarawak Dementia Care in the News (News) ---- */}
      <section id="media-coverage" className="events-feature-section media-coverage-section">
        <div className="section-container">
          <div className="events-section-header">
            <span className="section-label">{ev.mediaHeadlines || le?.pressHighlights || "Press & Media Highlights"}</span>
            <h2>{ev.mediaHeadlines || "Sarawak Dementia Care in the Headlines"}</h2>
            <p>
              {ev.mediaDesc || "Major regional news articles and press features reporting on the Rotary HopeCare initiative, public dialogues, and train-the-trainer education."}
            </p>
          </div>

          <div className="news-clippings-grid">
            {/* News Card 1: Sin Chew Daily */}
            <article
              className="news-clipping-card"
              onClick={() =>
                setLightboxData({
                  image: newsSinChew,
                  title: "Malaysia Sin Chew Daily (马来西亚星洲日报)",
                  subtitle: "Sarawak Regional Press Feature",
                  caption:
                    "Feature article reporting on the Rotary Club of Bintulu Central HopeCare project, highlighting dementia education, stigma reduction, and family caregiver workshops.",
                  date: "Published Feature",
                })
              }
            >
              <div className="news-img-wrap">
                <img src={newsSinChew} alt="Malaysia Sin Chew Daily Press Coverage" />
                <div className="news-img-hover-overlay">
                  <span>🔍 Read Newspaper Clipping</span>
                </div>
              </div>
              <div className="news-card-body">
                <div className="news-outlet-meta">
                  <span className="news-outlet-tag">Malaysia Sin Chew Daily</span>
                  <span className="news-lang-pill">中文报道</span>
                </div>
                <h3>Empowering Families &amp; Community Dementia Care in Sarawak</h3>
                <p>
                  In-depth reporting on the collaboration between Rotary Club of Bintulu Central,
                  local clinicians, and ADFM trainers to establish support networks for elderly families.
                </p>
                <div className="news-action-bar">
                  <span className="news-click-prompt">Click to open high-res newspaper clipping ↗</span>
                </div>
              </div>
            </article>

            {/* News Card 2: See Hua Daily News */}
            <article
              className="news-clipping-card"
              onClick={() =>
                setLightboxData({
                  image: newsSeeHua,
                  title: "See Hua Daily News (诗华日报)",
                  subtitle: "Community News Coverage",
                  caption:
                    "Press coverage highlighting the launch of community dementia dialogues, Train-the-Trainer pathways, and resource distribution across Sarawak.",
                  date: "Press Release",
                })
              }
            >
              <div className="news-img-wrap">
                <img src={newsSeeHua} alt="See Hua Daily News Press Coverage" />
                <div className="news-img-hover-overlay">
                  <span>🔍 Read Newspaper Clipping</span>
                </div>
              </div>
              <div className="news-card-body">
                <div className="news-outlet-meta">
                  <span className="news-outlet-tag">See Hua Daily News</span>
                  <span className="news-lang-pill">Sarawak Press</span>
                </div>
                <h3>HopeCare Initiative: Bridging Gaps in Dementia Support</h3>
                <p>
                  Coverage detailing the expansion of dementia care education into secondary
                  towns like Bintulu, Miri, and Sibu to prevent caregiver isolation.
                </p>
                <div className="news-action-bar">
                  <span className="news-click-prompt">Click to open high-res newspaper clipping ↗</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ---- Section 5: Community Collaboration Banner ---- */}
      <section className="events-collab-cta-section">
        <div className="section-container">
          <div className="collab-cta-box">
            <div className="collab-cta-text">
              <span className="collab-label">Grassroots Collaboration</span>
              <h2>Want to Host a Dementia Dialogue in Your Town?</h2>
              <p>
                We partner with community halls, religious institutions, corporate offices,
                and health clinics across Sarawak to deliver free, culturally sensitive dementia education.
              </p>
            </div>
            <div className="collab-cta-actions">
              <a
                href="https://forms.google.com/"
                target="_blank"
                rel="noreferrer"
                className="collab-btn-primary"
              >
                Propose an Event / Venue ↗
              </a>
              <Link to="/learn-events/certified-trainers" className="collab-btn-secondary">
                View Certified Trainers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reusable Activity Detail Modal */}
      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}

      {/* Reusable Image Lightbox Modal */}
      {lightboxData && (
        <ImageLightboxModal
          isOpen={!!lightboxData}
          onClose={() => setLightboxData(null)}
          image={lightboxData.image}
          title={lightboxData.title}
          subtitle={lightboxData.subtitle}
          caption={lightboxData.caption}
          date={lightboxData.date}
        />
      )}
    </main>
  );
}

/* ================================================================
   SECTION 4: CERTIFIED TRAINERS (Restored & Supercharged with ADFM & Toolkit)
   ================================================================ */
/* ================================================================
   MEDICAL CAROUSEL — draggable, auto-flowing, prev/next
   ================================================================ */
function MedicalCarousel({ trainers: carouselTrainers, onSelect, onViewAll }) {
  const { t } = useLanguage();
  const cs = t.learnEvents?.certifiedTrainersSection || {};
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const hasDragged = useRef(false);
  const isUserInteracting = useRef(false);
  const resumeTimeout = useRef(null);

  const pauseAndResume = useCallback(() => {
    isUserInteracting.current = true;
    clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 2500);
  }, []);

  /* ---- Auto-scroll (seamless continuous flow with requestAnimationFrame) ---- */
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      const el = trackRef.current;
      if (el && !isUserInteracting.current) {
        const halfWidth = el.scrollWidth / 2;
        if (halfWidth > 0) {
          // Continuous gentle drift (~32px / sec)
          el.scrollLeft += (32 * dt) / 1000;
          if (el.scrollLeft >= halfWidth) {
            el.scrollLeft -= halfWidth;
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  /* ---- Prev / Next ---- */
  const scrollBy = useCallback((dir) => {
    const el = trackRef.current;
    if (!el) return;
    pauseAndResume();

    const card = el.querySelector(".ct-mc-card");
    const step = card ? card.offsetWidth + 20 : 280;
    const halfWidth = el.scrollWidth / 2;

    if (dir < 0 && el.scrollLeft <= 10) {
      el.scrollLeft += halfWidth;
    } else if (dir > 0 && el.scrollLeft >= halfWidth - 10) {
      el.scrollLeft -= halfWidth;
    }

    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }, [pauseAndResume]);

  /* ---- Drag (pointer events) ---- */
  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.clientX;
    startScroll.current = trackRef.current?.scrollLeft ?? 0;
    pauseAndResume();
    trackRef.current?.setPointerCapture(e.pointerId);
  }, [pauseAndResume]);

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current || !trackRef.current) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 4) hasDragged.current = true;

    const el = trackRef.current;
    const halfWidth = el.scrollWidth / 2;
    let nextScroll = startScroll.current - dx;
    if (halfWidth > 0) {
      if (nextScroll >= halfWidth) {
        nextScroll -= halfWidth;
        startX.current = e.clientX;
        startScroll.current = nextScroll;
      } else if (nextScroll < 0) {
        nextScroll += halfWidth;
        startX.current = e.clientX;
        startScroll.current = nextScroll;
      }
    }
    el.scrollLeft = nextScroll;
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    setTimeout(() => { hasDragged.current = false; }, 50);
  }, []);

  const onMouseEnter = useCallback(() => {
    isUserInteracting.current = true;
    clearTimeout(resumeTimeout.current);
  }, []);

  const onMouseLeave = useCallback(() => {
    if (!isDragging.current) {
      clearTimeout(resumeTimeout.current);
      resumeTimeout.current = setTimeout(() => {
        isUserInteracting.current = false;
      }, 400);
    }
  }, []);

  if (!carouselTrainers || carouselTrainers.length === 0) return null;

  // Duplicate the list to create a seamless infinite circular buffer
  const items = [...carouselTrainers, ...carouselTrainers];

  return (
    <section className="ct-carousel-section">
      <div className="section-container">
        <div className="ct-carousel-header">
          <div className="ct-carousel-header-text">
            <span className="ct-section-eyebrow">{cs.clinicalFrontline || "Clinical Frontline"}</span>
            <h3 className="ct-section-title">{cs.medicalProfessionals || "Medical Professionals"}</h3>
            <p className="ct-section-sub">
              {carouselTrainers.length} certified trainers · Drag, use arrows, or let it flow
            </p>
          </div>
          <div className="ct-carousel-nav-btns">
            <button type="button" className="ct-nav-btn" onClick={() => scrollBy(-1)} aria-label="Previous trainer">←</button>
            <button type="button" className="ct-nav-btn" onClick={() => scrollBy(1)} aria-label="Next trainer">→</button>
          </div>
        </div>

        <div className="ct-carousel-outer">
          <div
            className="ct-carousel-track"
            ref={trackRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            role="list"
            aria-label="Medical professional trainers"
          >
            {items.map((t, idx) => (
              <div
                key={`mc-${t.id}-${idx}`}
                className="ct-mc-card"
                style={{ "--mc-color": t.badgeColor || "#0d716b" }}
                role="listitem"
              >
                <div className="ct-mc-top-bar" aria-hidden="true" />
                <div className="ct-mc-avatar-wrap">
                  <div className="ct-mc-avatar">
                    <span className="ct-mc-initials">{t.initials}</span>
                    <span className="ct-mc-verified" aria-hidden="true">✓</span>
                  </div>
                </div>
                <div className="ct-mc-body">
                  <span className="ct-mc-badge">{cs.clinicalFacilitator || "Clinical Facilitator"}</span>
                  <strong className="ct-mc-name">{t.name}</strong>
                  <span className="ct-mc-role">{t.role}</span>
                  <span className="ct-mc-inst">{t.institution.split(",")[0]}</span>
                </div>
                <div className="ct-mc-footer">
                  <button
                    type="button"
                    className="ct-mc-cta"
                    onClick={() => !hasDragged.current && onSelect(t)}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label={`View profile of ${t.name}`}
                  >
                    View profile →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ct-carousel-bottom">
          <button type="button" className="ct-view-all-btn" onClick={onViewAll}>View full directory →</button>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   SECTION 4: CERTIFIED TRAINERS
   ================================================================ */
function CertifiedTrainers() {
  const { t: i18nData } = useLanguage();
  const le = i18nData.learnEvents;
  const cs = le?.certifiedTrainersSection || {};
  const activities = usePublicActivities();
  const [trainers, setTrainers] = useState(defaultTrainers);
  const [directoryError, setDirectoryError] = useState("");
  useEffect(() => {
    let alive = true;
    fetch('/api/trainers')
      .then(r => { if (!r.ok) throw new Error('Trainer directory unavailable'); return r.json(); })
      .then(rows => {
        if (alive && Array.isArray(rows) && rows.length > 0) {
          setTrainers(rows.map(t => ({ ...t, category: 'certified-trainer', role: 'Certified Trainer', institution: 'RCBC', bio: t.short_profile, initials: t.name.split(' ').map(n => n[0]).join(''), photo: t.photo_url })));
        }
      })
      .catch(e => { if (alive) setDirectoryError(e.message); });
    return () => { alive = false; };
  }, []);

  const [selectedFacilitatorModal, setSelectedFacilitatorModal] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [trainerCity, setTrainerCity] = useState("All cities");
  const [trainerLanguage, setTrainerLanguage] = useState("All languages");
  const [expandedTrainer, setExpandedTrainer] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [trainerLightbox, setTrainerLightbox] = useState(null);

  const clinicalFacilitators = useMemo(() => trainers.filter((t) => t.category === "medical-professional"), [trainers]);
  const advisoryFacilitators = useMemo(() => trainers.filter((t) => t.category === "advisory-support"), [trainers]);

  const getTrainerActivities = (trainerId) => activities.filter((a) => (a.trainerId === trainerId || a.trainers?.some(t => t.trainerId === trainerId)));

  const filteredTrainers = useMemo(() => trainers.filter((t) => {
    if (activeCategory !== "all" && t.category !== activeCategory) return false;
    if (trainerCity !== "All cities" && t.city !== trainerCity) return false;
    if (trainerLanguage !== "All languages" && !t.language.toLowerCase().includes(trainerLanguage.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const text = `${t.name} ${t.role} ${t.institution} ${t.city} ${t.bio}`.toLowerCase();
      if (!text.includes(searchQuery.toLowerCase().trim())) return false;
    }
    return true;
  }), [trainers, activeCategory, trainerCity, trainerLanguage, searchQuery]);

  const scrollToDirectory = (category = "all") => {
    setActiveCategory(category);
    const el = document.getElementById("trainer-directory");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const defaultTrainerSteps = [
    { num: "01", title: "Learn", subtitle: "Foundations & Clinical Insight", desc: "Build a strong understanding of dementia types, symptom progression, and person-centred care principles guided by ADFM syllabus." },
    { num: "02", title: "Prepare", subtitle: "Audience & Curriculum Selection", desc: "Select the appropriate DCS module and tailor slide decks to your local community dialect." },
    { num: "03", title: "Deliver", subtitle: "Facilitate with Empathy & Dignity", desc: "Conduct interactive, judgment-free workshops that invite active storytelling and teach practical daily techniques." },
    { num: "04", title: "Reflect", subtitle: "Participant Feedback & Assessment", desc: "Collect feedback forms, log attendance with the RCBC committee, and evaluate areas for improvement." },
    { num: "05", title: "Connect", subtitle: "Sustained Community Respite", desc: "Link participants with local support groups, memory clinics, and future webinars so no family walks alone." },
  ];

  const defaultTrainerFaqs = [
    { q: "Can certified trainers adapt materials into local dialects?", a: "Yes. Trainers are encouraged to deliver sessions in local Sarawakian dialects. However, core medical terminology and slide contents must follow the approved RCBC & ADFM framework." },
    { q: "How should personal medical or diagnostic questions be handled?", a: "Community education sessions must remain educational, not diagnostic. Trainers guide participants to qualified geriatricians or government clinics for formal assessment." },
    { q: "How do I register or announce a new community workshop?", a: "Certified trainers can submit planned session dates via the RCBC Trainer Portal. Once approved, sessions are published on this website's Upcoming Calendar." },
    { q: "What are the eligibility requirements for DCS-TTT certification?", a: "Applicants should be healthcare professionals, certified educators, or senior community NGO volunteers with eldercare experience. Applications undergo review by RCBC and ADFM master trainers." },
  ];

  const trainerSteps = (cs.pathwaySteps && cs.pathwaySteps.length > 0) ? cs.pathwaySteps : defaultTrainerSteps;
  const trainerFaqs = (cs.faqs && cs.faqs.length > 0) ? cs.faqs : defaultTrainerFaqs;

  return (
    <main className="module-main certified-trainers-module">
      {directoryError && <p role="alert">{directoryError}</p>}

      {/* ======================================================
          HERO
      ====================================================== */}
      <section className="ct-hero">
        <div className="section-container">
          <div className="ct-hero-inner">
            <span className="ct-eyebrow">{cs.eyebrow || "RCBC & ADFM Certified"}</span>
            <h2 className="ct-hero-title">
              {cs.heroTitlePrefix || "Meet your"}<br /><em>{cs.heroTitleEm || "facilitators."}</em>
            </h2>
            <p className="ct-hero-sub">
              {cs.heroSub || "Experienced medical professionals certified under the Dementia Care Series (DCS-TTT) framework — bringing real caregiving knowledge to every session."}
            </p>
            <div className="ct-hero-stats">
              <div className="ct-stat"><strong>9</strong><span>{cs.statTrainers || "Certified Trainers"}</span></div>
              <div className="ct-stat-divider" />
              <div className="ct-stat"><strong>3</strong><span>{cs.statAdvisory || "Advisory Specialists"}</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          CAROUSEL — Medical Professionals
      ====================================================== */}
      <MedicalCarousel
        trainers={clinicalFacilitators}
        onSelect={setSelectedFacilitatorModal}
        onViewAll={() => scrollToDirectory("medical-professional")}
      />

      {/* ======================================================
          ADVISORY BOARD
      ====================================================== */}
      <section className="ct-advisory-section">
        <div className="section-container">
          <div className="ct-advisory-header">
            <span className="ct-section-eyebrow advisory">{cs.clinicalGovernance || "Clinical Governance"}</span>
            <h3 className="ct-section-title">{cs.advisoryTitle || "ADFM QA/QC Advisory Board"}</h3>
            <p className="ct-section-sub">
              {cs.advisorySub || "Senior specialists overseeing curriculum fidelity and certification standards."}
            </p>
          </div>

          <div className="ct-advisory-grid">
            {advisoryFacilitators.map((t) => (
              <button
                key={t.id}
                type="button"
                className="ct-advisory-card"
                style={{ "--advisory-color": t.badgeColor || "#1e3a8a" }}
                onClick={() => setSelectedFacilitatorModal(t)}
                aria-label={`View profile of ${t.name}`}
              >
                <div className="ct-advisory-avatar">
                  <span className="ct-advisory-initials">{t.initials}</span>
                </div>
                <div className="ct-advisory-info">
                  <span className="ct-advisory-badge">{cs.advisoryBoardBadge || "Advisory Board"}</span>
                  <strong className="ct-advisory-name">{t.name}</strong>
                  <span className="ct-advisory-role">{t.role}</span>
                  <span className="ct-advisory-inst">{t.institution.split(",")[0]}</span>
                </div>
                <div className="ct-advisory-footer">
                  <span className="ct-advisory-cta">View profile →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          DIRECTORY — filter + grid
      ====================================================== */}
      <section id="trainer-directory" className="trainer-directory-section">
        <div className="section-container">
          <div className="trainer-boundary-banner" role="note">
            <div className="boundary-shield-icon" aria-hidden="true">🛡️</div>
            <div className="boundary-text-content">
              <h4>{cs.scopeBoundaryTitle || "Certification Scope & Boundary"}</h4>
              <p>
                {cs.scopeBoundaryDesc || "Certified Trainer status is granted strictly for community dementia education under the RCBC & ADFM DCS-TTT initiative, and should not be construed as a broader clinical endorsement or guarantee."}
              </p>
            </div>
          </div>

          <div className="directory-header-row">
            <div>
              <span className="section-label">Verified Profiles</span>
              <h2>{le?.directoryTitle || "Trainer Directory & Approved Activities"}</h2>
            </div>
          </div>

          <div className="directory-controls-bar">
            <div className="directory-track-tabs" role="tablist" aria-label="Facilitator Category">
              <button type="button" className={`track-tab-btn ${activeCategory === "all" ? "is-active" : ""}`} onClick={() => setActiveCategory("all")} role="tab" aria-selected={activeCategory === "all"}>{le?.all || "All"} ({trainers.length})</button>
              <button type="button" className={`track-tab-btn ${activeCategory === "medical-professional" ? "is-active" : ""}`} onClick={() => setActiveCategory("medical-professional")} role="tab" aria-selected={activeCategory === "medical-professional"}>{cs.categoryClinical || "Clinical"} ({clinicalFacilitators.length})</button>
              <button type="button" className={`track-tab-btn ${activeCategory === "advisory-support" ? "is-active" : ""}`} onClick={() => setActiveCategory("advisory-support")} role="tab" aria-selected={activeCategory === "advisory-support"}>{cs.categoryAdvisory || "Advisory"} ({advisoryFacilitators.length})</button>
            </div>
            <div className="directory-filters-cluster">
              <div className="directory-search-input-wrap">
                <input type="text" placeholder={le?.searchPlaceholder || "Search name, clinic, or role..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} aria-label="Search trainers" />
                {searchQuery && <button type="button" className="search-clear-btn" onClick={() => setSearchQuery("")} aria-label="Clear">&times;</button>}
              </div>
              <select value={trainerCity} onChange={(e) => setTrainerCity(e.target.value)} aria-label="Filter by city">
                <option value="All cities">{le?.allCities || "All cities"}</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={trainerLanguage} onChange={(e) => setTrainerLanguage(e.target.value)} aria-label="Filter by language">
                <option value="All languages">{le?.allLanguages || "All languages"}</option>
                {languages.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {filteredTrainers.length > 0 ? (
            <div className="trainer-profiles-grid">
              {filteredTrainers.map((t) => {
                const trainerActivities = getTrainerActivities(t.id);
                const upcomingCount = trainerActivities.filter((a) => a.status === "upcoming").length;
                const pastCount = trainerActivities.filter((a) => a.status === "completed").length;
                const isOpen = expandedTrainer === t.id;
                const isAdvisory = t.category === "advisory-support";
                return (
                  <article className={`trainer-profile-card ${isAdvisory ? "card-advisory-theme" : ""} ${isOpen ? "is-expanded" : ""}`} key={t.id}>
                    <div className="trainer-card-topbar">
                      <div className="trainer-avatar-wrap" style={{ backgroundColor: t.badgeColor || "#0d716b" }}>
                        {t.photo ? <img src={t.photo} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : <span className="trainer-avatar-letter">{t.initials || t.name.charAt(0)}</span>}
                        <span className="trainer-verified-check" title="RCBC Verified">✓</span>
                      </div>
                      <div className="trainer-primary-info">
                        <span className={`trainer-category-chip ${isAdvisory ? "chip-advisory" : "chip-clinical"}`}>{isAdvisory ? "Advisory Board" : "Certified Trainer"}</span>
                        <h3>{t.name}</h3>
                        <p className="trainer-role-title"><strong>{t.role}</strong> &bull; {t.institution}</p>
                      </div>
                    </div>
                    <div className="trainer-meta-strip">
                      <div className="trainer-meta-col"><span className="meta-lbl">{le?.locationLabel || "Location"}</span><strong className="meta-val">📍 {t.city}</strong></div>
                      <div className="trainer-meta-col"><span className="meta-lbl">{le?.languageLabel || "Languages"}</span><strong className="meta-val">🌐 {t.language}</strong></div>
                    </div>
                    <p className="trainer-biography">{t.bio}</p>
                    <div className="trainer-activity-counter-bar">
                      <div className="counter-col"><strong>{upcomingCount}</strong><span>{le?.upcoming || "Upcoming"}</span></div>
                      <div className="counter-divider" />
                      <div className="counter-col"><strong>{pastCount}</strong><span>{le?.past || "Past"}</span></div>
                    </div>
                    {isOpen && (
                      <div className="trainer-drawer-content">
                        <h4>Sessions by {t.name}:</h4>
                        {trainerActivities.length > 0 ? (
                          <div className="drawer-activities-list">
                            {trainerActivities.map((act) => (
                              <div className="drawer-activity-item" key={act.id}>
                                <div className="drawer-act-main">
                                  <span className="drawer-act-type">{act.type}</span>
                                  <strong>{act.title}</strong>
                                  <small>📅 {act.date} · 📍 {act.location}</small>
                                </div>
                                <StatusBadge status={act.status} />
                              </div>
                            ))}
                          </div>
                        ) : <p className="drawer-empty-text">No active sessions assigned.</p>}
                      </div>
                    )}
                    <div className="trainer-card-actions">
                      <button type="button" className="trainer-full-profile-btn" onClick={() => setSelectedFacilitatorModal(t)}>{le?.viewTrainerProfile ? `${le.viewTrainerProfile} →` : "View Full Profile & Activities →"}</button>
                      <div className="trainer-sub-actions-row">
                        <button type="button" className="trainer-expand-toggle-btn" onClick={() => setExpandedTrainer(isOpen ? null : t.id)} aria-expanded={isOpen}>{isOpen ? "Hide Sessions ▲" : `Sessions (${trainerActivities.length}) ▼`}</button>
                        <a href="https://forms.google.com/" target="_blank" rel="noreferrer" className="trainer-contact-btn">{le?.requestFacilitator || "Request Facilitator ↗"}</a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="directory-empty-state">
              <span className="empty-icon">🔍</span>
              <h3>{cs.noFacilitators || "No facilitators match your criteria"}</h3>
              <button type="button" className="primary-button" onClick={() => { setActiveCategory("all"); setSearchQuery(""); setTrainerCity("All cities"); setTrainerLanguage("All languages"); }}>{le?.resetFilters || "Reset Filters"}</button>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================
          ADFM FRAMEWORK SHOWCASE
      ====================================================== */}
      <section className="trainers-framework-section">
        <div className="section-container">
          <div className="framework-box">
            <div className="framework-text">
              <span className="framework-chip">{cs.frameworkChip || "ADFM Credentialing"}</span>
              <h3>{cs.frameworkTitle || "Certification Syllabus & Guidelines"}</h3>
              <p>{cs.frameworkDesc || "Evidence-based standards governing every certified trainer. Click to view the full guide."}</p>
            </div>
            <div className="framework-posters-row">
              <div className="framework-card" role="button" tabIndex={0} onClick={() => setTrainerLightbox({ image: adfmPoster, title: "ADFM Certified Trainers Framework", subtitle: "Official Dementia Training Syllabus", caption: "Official syllabus overview and certification standards." })} onKeyDown={(e) => e.key === "Enter" && setTrainerLightbox({ image: adfmPoster, title: "ADFM Certified Trainers Framework", subtitle: "Official Dementia Training Syllabus", caption: "Official syllabus." })}>
                <div className="framework-thumb-wrap"><img src={adfmPoster} alt="ADFM Certified Trainers Poster" /><div className="framework-hover-hint"><span>🔍 View Poster</span></div></div>
                <div className="framework-card-info"><h4>{cs.adfmPosterTitle || "ADFM Certified Trainers Poster"}</h4><small>{cs.clickHighRes || "Click to view high-res guide"}</small></div>
              </div>
              <div className="framework-card" role="button" tabIndex={0} onClick={() => setTrainerLightbox({ image: facilitatorInfo, title: "Facilitator Information & Delivery Scope", subtitle: "ADFM Accredited Facilitator Guidelines", caption: "Facilitator competency standards and approved delivery scope." })} onKeyDown={(e) => e.key === "Enter" && setTrainerLightbox({ image: facilitatorInfo, title: "Facilitator Information", subtitle: "ADFM Guidelines", caption: "Facilitator standards." })}>
                <div className="framework-thumb-wrap"><img src={facilitatorInfo} alt="Facilitator Information Guide" /><div className="framework-hover-hint"><span>🔍 View Info</span></div></div>
                <div className="framework-card-info"><h4>{cs.facilitatorInfoTitle || "Facilitator Information Guide"}</h4><small>{cs.clickStandards || "Click to view standards & code"}</small></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          5-STEP TRAINER JOURNEY
      ====================================================== */}
      <section className="trainer-journey-section">
        <div className="section-container">
          <div className="events-section-header">
            <span className="section-label">{cs.pathwaySectionLabel || "Trainer Pathway"}</span>
            <h2>{cs.pathwayTitle || "Your journey as a trainer"}</h2>
            <p>{cs.pathwaySub || "Five stages from learning to community impact."}</p>
          </div>
          <div className="trainer-steps-grid">
            {trainerSteps.map((step) => (
              <article className="trainer-step-card" key={step.num}>
                <div className="step-num-badge">{step.num}</div>
                <h3>{step.title}</h3>
                <span className="step-sub">{step.subtitle}</span>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          FAQS
      ====================================================== */}
      <section className="trainer-faqs-section">
        <div className="section-container">
          <div className="events-section-header">
            <span className="section-label">{cs.quickAnswersLabel || "Quick Answers"}</span>
            <h2>{cs.faqsTitle || "Frequently asked questions"}</h2>
          </div>
          <div className="trainer-faqs-accordion">
            {trainerFaqs.map((faq, idx) => {
              const isFaqOpen = openFaq === idx;
              return (
                <div className={`trainer-faq-row ${isFaqOpen ? "is-active" : ""}`} key={faq.q}>
                  <button type="button" className="faq-trigger-btn" onClick={() => setOpenFaq(isFaqOpen ? null : idx)} aria-expanded={isFaqOpen}>
                    <span>{faq.q}</span>
                    <span className="faq-icon" aria-hidden="true">{isFaqOpen ? "\u2212" : "+"}</span>
                  </button>
                  {isFaqOpen && <div className="faq-answer-panel"><p>{faq.a}</p></div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================
          CTA
      ====================================================== */}
      <section className="trainer-bottom-cta">
        <div className="section-container">
          <div className="cta-box-content">
            <h2>{cs.ctaTitle || "Ready to expand dementia education across Sarawak?"}</h2>
            <p>{cs.ctaSub || "Join our certified trainer community or explore upcoming events."}</p>
            <div className="cta-btn-row">
              <Link to="/learn-events/physical-education" className="primary-button">{cs.ctaLearnBtn || "Learn About DCS-TTT Certification ↗"}</Link>
              <Link to="/learn-events/events" className="btn-secondary">{cs.ctaEventsBtn || "View Community Events"}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      {selectedFacilitatorModal && <FacilitatorProfileModal facilitator={selectedFacilitatorModal} activities={activities} onClose={() => setSelectedFacilitatorModal(null)} />}
      {trainerLightbox && <ImageLightboxModal isOpen={!!trainerLightbox} onClose={() => setTrainerLightbox(null)} image={trainerLightbox.image} title={trainerLightbox.title} subtitle={trainerLightbox.subtitle} caption={trainerLightbox.caption} />}
    </main>
  );
}

/* ================================================================
   UPCOMING CALENDAR — helpers
   ================================================================ */

// Parse "15 Oct 2026", "23 Jun 2026", "16 May 2026" → Date
function parseActivityDate(dateStr) {
  if (!dateStr || dateStr === "Past webinar") return new Date(NaN);
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return new Date(NaN);
    const local = date.toLocaleDateString("sv-SE", { timeZone: "Asia/Kuala_Lumpur" });
    const [y, m, d] = local.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const parts = dateStr.trim().split(" ");
  if (parts.length < 3) return new Date(NaN);
  const day = parseInt(parts[0], 10);
  const mon = months[parts[1]];
  const yr = parseInt(parts[2], 10);
  if (Number.isNaN(day) || mon === undefined || Number.isNaN(yr)) return new Date(NaN);
  return new Date(yr, mon, day);
}

// Map activity type → short CSS slug
function getTypeSlug(type) {
  const map = {
    "RCBC Webinar": "rcbc",
    "CT Webinar": "ct",
    "Planned Webinar": "planned",
    "DCS-Family": "dcs-family",
    "DCS-TTT": "dcs-ttt",
    "Expo": "expo",
    "Dialogue": "dialogue",
    "Forum": "forum",
    "Workshop": "workshop",
    "Public Talk": "talk",
    "Masterclass": "masterclass",
    "Other": "other",
  };
  return map[type] || "other";
}

const UC_LEGEND = [
  { label: "RCBC Webinar", slug: "rcbc" },
  { label: "CT Webinar", slug: "ct" },
  { label: "DCS Programme", slug: "dcs-family" },
  { label: "Expo / Event", slug: "expo" },
  { label: "Dialogue", slug: "dialogue" },
  { label: "Public Talk", slug: "talk" },
  { label: "Past", slug: "past" },
];

function UpcomingCalendar() {
  const activities = usePublicActivities();
  const { t } = useLanguage();
  const le = t.learnEvents;
  // ---- State ----
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [typeFilter, setTypeFilter] = useState("All types");
  const [modeFilter, setModeFilter] = useState("All modes");
  const [cityFilter, setCityFilter] = useState("All cities");
  const [languageFilter, setLanguageFilter] = useState("All languages");
  const detailRef = useRef(null);

  // ---- Merge all dateable events ----
  const allCalendarEvents = useMemo(() => {
    const merged = activities;
    return merged.filter((a) => {
      if (!a.date || a.date === "Past webinar") return false;
      return !Number.isNaN(parseActivityDate(a.date));
    });
  }, [activities]);

  // ---- Apply filters ----
  const filteredEvents = useMemo(() => {
    return allCalendarEvents.filter((a) => {
      if (typeFilter !== "All types" && a.type !== typeFilter) return false;
      if (modeFilter !== "All modes" && a.mode !== modeFilter) return false;
      if (cityFilter !== "All cities") {
        const matchesCity = a.city === cityFilter || (a.location && a.location.toLowerCase().includes(cityFilter.toLowerCase()));
        if (!matchesCity) return false;
      }
      if (languageFilter !== "All languages" &&
        !a.language.toLowerCase().includes(languageFilter.toLowerCase())) return false;
      return true;
    });
  }, [allCalendarEvents, typeFilter, modeFilter, cityFilter, languageFilter]);

  // ---- Build a map: "YYYY-MM-DD" → [events] ----
  const eventsByDay = useMemo(() => {
    const map = {};
    filteredEvents.forEach((a) => {
      const d = parseActivityDate(a.date);
      if (Number.isNaN(d)) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [filteredEvents]);

  // ---- Calendar grid helpers ----
  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedEvent(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedEvent(null);
  };
  const goToday = () => {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
    setSelectedEvent(null);
  };

  const isToday = (day) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const eventsForDay = (day) =>
    eventsByDay[`${viewYear}-${viewMonth}-${day}`] || [];

  // Close detail panel on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setSelectedEvent(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus detail panel when event selected
  useEffect(() => {
    if (selectedEvent && detailRef.current) {
      detailRef.current.focus({ preventScroll: true });
    }
  }, [selectedEvent]);

  // ---- Unique filter options from all calendar events ----
  const calTypes = useMemo(() => {
    const s = new Set(allCalendarEvents.map((a) => a.type));
    return [...s].sort();
  }, [allCalendarEvents]);

  const calCities = useMemo(() => {
    const set = new Set(cities);
    allCalendarEvents.forEach((a) => {
      if (a.city && a.city !== "Online") set.add(a.city);
    });
    return [...set].sort();
  }, [allCalendarEvents]);

  const hasActiveFilters =
    typeFilter !== "All types" ||
    modeFilter !== "All modes" ||
    cityFilter !== "All cities" ||
    languageFilter !== "All languages";

  // ---- Build grid cells (leading blanks + day cells) ----
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <main className="module-main">
      <section className="uc-page">
        <div className="section-container">

          {/* ---- Page header ---- */}
          <div className="uc-page-header">
            <div>
              <span className="eyebrow">{le?.pageInfo?.["upcoming-calendar"]?.eyebrow || "Upcoming Calendar"}</span>
              <h2 className="uc-page-title">{le?.calendarTitle || "All Education & Events"}</h2>
              <p className="uc-page-sub">
                {le?.calendarSub || "Online education, physical programmes and community events — all in one view. Click any event to see details."}
              </p>
            </div>
          </div>

          {/* ---- Filters ---- */}
          <div className="uc-filters">
            <div className="uc-filter-group">
              <label htmlFor="uc-type" className="uc-filter-label">{le?.type || "Type"}</label>
              <select
                id="uc-type"
                className="uc-filter-select"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setSelectedEvent(null); }}
              >
                <option value="All types">{le?.allTypes || "All types"}</option>
                {calTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="uc-filter-group">
              <label htmlFor="uc-mode" className="uc-filter-label">{le?.mode || "Mode"}</label>
              <select
                id="uc-mode"
                className="uc-filter-select"
                value={modeFilter}
                onChange={(e) => { setModeFilter(e.target.value); setSelectedEvent(null); }}
              >
                <option value="All modes">{le?.allModes || "All modes"}</option>
                {modes.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="uc-filter-group">
              <label htmlFor="uc-city" className="uc-filter-label">{le?.city || "City"}</label>
              <select
                id="uc-city"
                className="uc-filter-select"
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setSelectedEvent(null); }}
              >
                <option value="All cities">{le?.allCities || "All cities"}</option>
                {calCities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="uc-filter-group">
              <label htmlFor="uc-lang" className="uc-filter-label">{le?.language || "Language"}</label>
              <select
                id="uc-lang"
                className="uc-filter-select"
                value={languageFilter}
                onChange={(e) => { setLanguageFilter(e.target.value); setSelectedEvent(null); }}
              >
                <option value="All languages">{le?.allLanguages || "All languages"}</option>
                {languages.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="uc-clear-btn"
                onClick={() => {
                  setTypeFilter("All types");
                  setModeFilter("All modes");
                  setCityFilter("All cities");
                  setLanguageFilter("All languages");
                }}
              >
                {le?.clearFilters || "Clear filters"}
              </button>
            )}

            <span className="uc-event-count">{filteredEvents.length} {filteredEvents.length === 1 ? (le?.item || "event") : (le?.items || "events")}</span>
          </div>

          {/* ---- Calendar + Detail panel ---- */}
          <div className={`uc-layout ${selectedEvent ? "uc-layout-split" : ""}`}>

            {/* ---- Calendar panel ---- */}
            <div className="uc-calendar-panel">
              {/* Month navigation */}
              <div className="uc-month-nav">
                <button type="button" className="uc-nav-btn" onClick={prevMonth} aria-label={le?.previousMonth || "Previous month"}>‹</button>
                <div className="uc-month-label">
                  <h3>{(le?.months || MONTH_NAMES)[viewMonth]} {viewYear}</h3>
                </div>
                <button type="button" className="uc-nav-btn" onClick={nextMonth} aria-label={le?.nextMonth || "Next month"}>›</button>
                <button type="button" className="uc-today-btn" onClick={goToday}>{le?.today || "Today"}</button>
              </div>

              {/* Day-of-week header */}
              <div className="uc-grid-header">
                {(le?.days || DAY_LABELS).map((d) => (
                  <div key={d} className="uc-day-label">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="uc-grid">
                {cells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`blank-${idx}`} className="uc-cell uc-cell-blank" />;
                  }
                  const dayEvents = eventsForDay(day);
                  const todayClass = isToday(day) ? "uc-cell-today" : "";
                  const hasEvents = dayEvents.length > 0;
                  const isSelectedDay = selectedEvent && dayEvents.some((ev) => ev.id === selectedEvent.id);
                  const visibleEvents = dayEvents.slice(0, 5);
                  const overflow = dayEvents.length - visibleEvents.length;
                  return (
                    <div
                      key={`day-${day}`}
                      className={`uc-cell ${todayClass} ${hasEvents ? "uc-cell-has-events" : ""} ${isSelectedDay ? "uc-cell-selected" : ""}`}
                      onClick={hasEvents ? () => {
                        if (dayEvents.length > 1 && selectedEvent) {
                          const currIdx = dayEvents.findIndex((ev) => ev.id === selectedEvent.id);
                          if (currIdx >= 0) {
                            setSelectedEvent(dayEvents[(currIdx + 1) % dayEvents.length]);
                            return;
                          }
                        }
                        setSelectedEvent(dayEvents[0]);
                      } : undefined}
                      role={hasEvents ? "button" : undefined}
                      tabIndex={hasEvents ? 0 : undefined}
                      onKeyDown={hasEvents ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedEvent(dayEvents[0]);
                        }
                      } : undefined}
                      aria-label={hasEvents ? `${day} ${(le?.months || MONTH_NAMES)[viewMonth]} ${viewYear}, ${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}` : undefined}
                    >
                      <span className="uc-cell-num">{day}</span>
                      {hasEvents && (
                        <div className="uc-cell-events-info">
                          <div className="uc-dots-row">
                            {visibleEvents.map((ev) => (
                              <button
                                key={ev.id}
                                type="button"
                                className={`uc-dot uc-dot-${getTypeSlug(ev.type)} ${ev.status === "completed" ? "uc-dot-past" : ""} ${selectedEvent?.id === ev.id ? "uc-dot-active" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(ev);
                                }}
                                aria-label={`${ev.title} on ${ev.date}`}
                                aria-pressed={selectedEvent?.id === ev.id}
                                data-tooltip={ev.title}
                              />
                            ))}
                            {overflow > 0 && (
                              <span className="uc-dot-overflow">+{overflow}</span>
                            )}
                          </div>
                          <div className="uc-cell-label-wrap">
                            <span className="uc-cell-event-title" title={dayEvents[0].title}>
                              {dayEvents[0].title}
                            </span>
                            {dayEvents.length > 1 && (
                              <span className="uc-cell-extra-badge">+{dayEvents.length - 1} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="uc-legend">
                {UC_LEGEND.map(({ label, slug }) => (
                  <div key={slug} className="uc-legend-item">
                    <span className={`uc-legend-dot uc-dot-${slug}`} aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ---- Detail panel ---- */}
            {selectedEvent ? (
              <div
                className="uc-detail-panel"
                ref={detailRef}
                tabIndex={-1}
                role="region"
                aria-label="Event details"
              >
                <button
                  type="button"
                  className="uc-detail-close"
                  onClick={() => setSelectedEvent(null)}
                  aria-label="Close event details"
                >
                  ×
                </button>

                {/* Poster */}
                {selectedEvent.poster && (
                  <div className="uc-detail-poster">
                    <img src={selectedEvent.poster} alt={`${selectedEvent.title} poster`} />
                  </div>
                )}

                {/* Header */}
                <div className="uc-detail-head">
                  <div className="uc-detail-tags">
                    <span className={`uc-detail-type-badge uc-dot-${getTypeSlug(selectedEvent.type)}`}>
                      {selectedEvent.type}
                    </span>
                    <StatusBadge status={selectedEvent.status} />
                  </div>
                  <h3 className="uc-detail-title">{selectedEvent.title}</h3>
                </div>

                {/* Meta list */}
                <dl className="uc-detail-meta">
                  {selectedEvent.suitableFor && (
                    <div className="uc-meta-row">
                      <dt>{le?.activityModal?.suitableFor || "Suitable for"}</dt>
                      <dd>{selectedEvent.suitableFor}</dd>
                    </div>
                  )}
                  <div className="uc-meta-row">
                    <dt>{le?.activityModal?.dateTime || "Date & time"}</dt>
                    <dd>
                      {selectedEvent.date}
                      {selectedEvent.time && <><br /><span className="uc-meta-time">{selectedEvent.time}</span></>}
                    </dd>
                  </div>
                  <div className="uc-meta-row">
                    <dt>{le?.activityModal?.mode || "Mode"}</dt>
                    <dd><ModeIcon mode={selectedEvent.mode} /></dd>
                  </div>
                  {selectedEvent.location && (
                    <div className="uc-meta-row">
                      <dt>{le?.activityModal?.location || "Location"}</dt>
                      <dd>{selectedEvent.location}</dd>
                    </div>
                  )}
                  <div className="uc-meta-row">
                    <dt>{le?.activityModal?.language || "Language"}</dt>
                    <dd>{selectedEvent.language}</dd>
                  </div>
                  {selectedEvent.speaker && (
                    <div className="uc-meta-row">
                      <dt>{le?.activityModal?.speakerTrainer || "Speaker / Trainer"}</dt>
                      <dd>
                        {selectedEvent.speaker}
                        {selectedEvent.trainerId && (
                          <>
                            {" — "}
                            <Link to="/learn-events/certified-trainers" className="uc-trainer-link">
                              {le?.activityModal?.viewTrainerProfile || "View trainer profile"}
                            </Link>
                          </>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>

                {/* Description */}
                {selectedEvent.description && (
                  <div className="uc-detail-desc">
                    <h4>{le?.activityModal?.whatYouWillLearn || "What you will learn"}</h4>
                    <p>{selectedEvent.description}</p>
                  </div>
                )}

                {/* Action */}
                <div className="uc-detail-action">
                  {selectedEvent.status === "cancelled" ? (
                    <span className="uc-action-past">{le?.upcomingCalendarSection?.cancelled || "This activity has been cancelled."}</span>
                  ) : selectedEvent.status === "completed" ? (
                    <span className="uc-action-past">{le?.upcomingCalendarSection?.completed || "This session has been completed."}</span>
                  ) : selectedEvent.registrationLink != null ? (
                    <a
                      href={selectedEvent.registrationLink || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="uc-register-btn"
                    >
                      {le?.activityModal?.registerNow || "Register Now"}
                      <small>{le?.upcomingCalendarSection?.registerExternal || le?.activityModal?.externalTabNote || "Opens external registration form"}</small>
                    </a>
                  ) : (
                    <button type="button" className="uc-register-btn uc-register-btn-disabled" disabled>
                      {le?.upcomingCalendarSection?.registerLinkSoon || le?.activityModal?.registrationLinkPending || "Registration link coming soon"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Empty state hint */
              <div className="uc-detail-empty" aria-hidden="true">
                <div className="uc-detail-empty-inner">
                  <span className="uc-empty-icon">📅</span>
                  <p>{le?.calendarHint || "Click any event on the calendar to see its details here."}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>
    </main>
  );
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
function LearnEvents({ module }) {
  const location = useLocation();
  const { t } = useLanguage();
  const le = t.learnEvents;
  const page = le?.pageInfo?.[module] || pageInfo[module] || pageInfo["online-education"];
  const rawPage = pageInfo[module] || pageInfo["online-education"];
  const heroImage = imageMap[rawPage.image] || webinarImage;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <main key={module} className="module-page">
      {/* ---- Hero ---- */}
      <section className="module-hero">
        <div className="section-container module-hero-grid">
          <div className="module-intro">
            <span className="section-label section-label-light">
              {page.eyebrow}
            </span>
            <h1>{page.title}</h1>
            <p>{page.intro}</p>
          </div>
          <img src={heroImage} alt={page.imageAlt || rawPage.imageAlt} />
        </div>
      </section>

      {/* ---- Section content ---- */}
      {module === "online-education" && <><PublishedRecords kind="learning_resources" title="Approved learning resources" /><OnlineEducation /></>}
      {module === "physical-education" && <PhysicalEducation />}
      {module === "events" && <EventsSection />}
      {module === "certified-trainers" && <CertifiedTrainers />}
      {module === "upcoming-calendar" && <UpcomingCalendar />}

      {/* ---- Module navigation ---- */}
      <section className="module-nav">
        <div className="section-container">
          <p>{le?.exploreText || "Explore education & events"}</p>
          <div className="module-nav-links">
            {sectionOrder.map((key) => (
              <Link
                key={key}
                to={`/learn-events/${pathFor(key)}`}
                className={
                  key === module
                    ? "module-nav-link active"
                    : "module-nav-link"
                }
              >
                {le?.pageInfo?.[key]?.eyebrow || pageInfo[key].eyebrow}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default LearnEvents;
