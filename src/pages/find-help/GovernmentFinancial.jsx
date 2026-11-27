import Trans from "../../i18n/Trans";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

import "./GovernmentFinancial.css";
import ReadMore from "../../components/ReadMore/ReadMore";
import HeroPhoto, { HeroWithPhoto } from "../../components/HeroPhoto/HeroPhoto";
import heroPhoto from "../../assets/banner-healthy-ageing.jpg";

const categories = [
  "All",
  "Government Support",
  "Financial Assistance",
  "Caregiver Support",
  "Older Persons",
];


function GovernmentResourceIcon({ category = "" }) {
  const common = {
    viewBox: "0 0 24 24",
    width: "28",
    height: "28",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (category.includes("Financial")) {
    return <svg {...common}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><circle cx="16" cy="14.5" r="1.5" /></svg>;
  }
  if (category.includes("Caregiver")) {
    return <svg {...common}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>;
  }
  if (category.includes("Older")) {
    return <svg {...common}><circle cx="12" cy="5" r="2" /><path d="M12 8v6M8 21l4-7 4 7M15 11h4v8" /></svg>;
  }
  return <svg {...common}><path d="M3 9h18L12 3 3 9Z" /><path d="M5 10v7M9 10v7M15 10v7M19 10v7" /><path d="M3 18h18" /></svg>;
}

function GovernmentFinancial() {
  const { t, translateLabel } = useLanguage();
  const gf = t.governmentFinancialPage || {};

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("All");

  const [directory, setDirectory] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/public/organisations?category=financial", {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load published financial records.");
        }
        return response.json();
      })
      .then((rows) => {
        setDirectory(Array.isArray(rows) ? rows : []);
        setDirectoryError("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setDirectoryError("Published financial records could not be loaded.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDirectoryLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const databaseResources = useMemo(() => {
    return directory.flatMap((record) => {
      const types =
        Array.isArray(record.services) && record.services.length
          ? record.services
          : ["Financial Assistance"];

      return types.map((type) => ({
        id: `${record.id}-${type}`,
        title: record.name || "Published financial resource",
        agency: record.source || "Not provided",
        category: type,
        location: [record.city, record.state].filter(Boolean).join(", ") || "Sarawak",
        summary: record.specialist_field || "No description provided.",
        eligibility: record.eligibility || "Not provided",
        access: record.website
          ? "Use the published official website."
          : "Not provided",
        phone: record.phone || "",
        email: record.email || "",
        website: record.website || "",
        verificationStatus: record.is_example
          ? "example"
          : record.review_status === "current"
            ? "verified"
            : "pending",
        status: record.is_example ? "Example only" : "Published",
        lastReviewed: record.last_reviewed_at
          ? new Date(record.last_reviewed_at).toLocaleDateString("en-MY")
          : "",
        source: record.source || "",
        isExample: Boolean(record.is_example),
      }));
    });
  }, [directory]);

  const filteredResources = useMemo(() => {
    return databaseResources.filter((resource) => {
      const searchableText = `
        ${resource.title}
        ${resource.agency}
        ${translateLabel(resource.category)}
        ${resource.location}
        ${translateLabel(resource.summary)}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(
        search.toLowerCase()
      );

      const matchesCategory =
        category === "All" ||
        resource.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [databaseResources, search, category]);

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
  };

  return (
    <main className="government-page">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="government-hero">
        <div className="government-container"><HeroWithPhoto photo={<HeroPhoto src={heroPhoto} alt="An older couple walking together in a park" />}>
          <span className="government-kicker">
            {gf.kicker || "Find Help & Support"}
          </span>

          <h1>
            {gf.title || "Government & Financial Resources"}
          </h1>

          <ReadMore text={gf.subtitle || "Find information about official government programmes, financial support and other external resources that may be relevant to you or your family."} />
        </HeroWithPhoto></div>
      </section>

      {/* =====================================================
          IMPORTANT BOUNDARY
      ====================================================== */}

      <section className="government-boundary-intro">
        <div className="government-container">
          <div className="government-boundary-card">
            <span className="government-boundary-icon">
              i
            </span>

            <div>
              <strong>
                {gf.boundaryTitle || "Information & Navigation Only"}
              </strong>

              <p>
                {gf.boundaryText || "Dementia Care Connect does not provide government benefits, financial assistance or subsidies. This page helps users find relevant official information and the responsible external agency."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          RESOURCE FINDER
      ====================================================== */}

      <section className="government-main">
        <div className="government-container">
          <div className="government-heading">
            <div>
              <span>
                {gf.kicker || t.header?.menu?.govtFinancial || "Government & Financial Resources"}
              </span>

              <h2>
                {gf.findProgrammesTitle || "Find relevant programmes and information."}
              </h2>
            </div>

            <p>
              {gf.findProgrammesSub || "Search by programme, agency or support type."}
            </p>
          </div>

          <div className="government-database-note">
            <strong><Trans id="directoryTitle">Database-managed directory</Trans></strong>
            <span><Trans id="financeDirectoryNote">
              Only published financial records from the RCBC admin database are shown here.
            </Trans></span>
          </div>

          {directoryLoading && (
            <p className="government-database-status" role="status"><Trans id="publishedLoading">
              Loading published resources…
            </Trans></p>
          )}

          {directoryError && (
            <p className="government-database-status" role="alert">
              {directoryError}
            </p>
          )}

          {/* FILTERS */}

          <div className="government-toolbar">
            <div className="government-search">
              <span aria-hidden="true">
                ⌕
              </span>

              <input
                type="search"
                placeholder={gf.searchPlaceholder || "Search programmes or agencies"}
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              aria-label={translateLabel("Filter resource category", "filterCategory")}
            >
              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item === "All"
                    ? (gf.allCategories || "All resource types")
                    : translateLabel(item)}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="government-reset"
              onClick={resetFilters}
            >
              {gf.reset || "Reset"}
            </button>
          </div>

          {/* COUNT */}

          <div className="government-result-count">
            <span>
              {gf.showing || "Showing"}
            </span>

            <strong>
              {filteredResources.length}
            </strong>

            <span>
              {filteredResources.length === 1
                ? (gf.resourceLabel || "resource")
                : (gf.resourcesLabel || "resources")}
            </span>
          </div>

          {/* RESULTS */}

          {filteredResources.length > 0 ? (
            <div className="government-grid">
              {filteredResources.map((resource) => (
                <article
                  key={resource.id}
                  className="government-card"
                >
                  <div className="government-card-visual" aria-hidden="true">
                    <GovernmentResourceIcon category={translateLabel(resource.category)} />
                  </div>

                  <div className="government-card-top">
                    <span className="government-category">
                      {translateLabel(resource.category)}
                    </span>

                    <span className="government-location">
                      ◎ {resource.location}
                    </span>
                  </div>

                  <h3>
                    {resource.title}
                  </h3>

                  <div className="government-agency">
                    <span>
                      {gf.responsibleAgency || "Responsible agency"}
                    </span>

                    <strong>
                      {resource.agency}
                    </strong>
                  </div>

                  <p className="government-summary">
                    {translateLabel(resource.summary)}
                  </p>

                  {/* INFORMATION */}

                  <div className="government-info-grid">
                    <div>
                      <span>
                        {gf.basicEligibility || "Basic eligibility"}
                      </span>

                      <p>
                        {translateLabel(resource.eligibility)}
                      </p>
                    </div>

                    <div>
                      <span>
                        {gf.howToAccess || "How to access"}
                      </span>

                      <p>
                        {translateLabel(resource.access)}
                      </p>
                    </div>
                  </div>

                  {/* CONTACT */}

                  <div className="government-contact">
                    <div>
                      <span>
                        {gf.phone || "Phone"}
                      </span>

                      <strong>
                        {resource.phone || (gf.pending || "Pending")}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {gf.email || "Email"}
                      </span>

                      <strong>
                        {resource.email || (gf.pending || "Pending")}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {gf.officialWebsite || "Official website"}
                      </span>

                      {resource.website ? (
                        <a
                          href={resource.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {gf.visitOfficial || "Visit official source ↗"}
                        </a>
                      ) : (
                        <strong>
                          {gf.pending || "Pending"}
                        </strong>
                      )}
                    </div>
                  </div>

                  {/* ADMIN STATUS */}

                  <div className="government-status-row">
                    <span
                      className={`government-verification government-verification-${resource.verificationStatus}`}
                    >
                      {resource.verificationStatus ===
                      "verified"
                        ? (gf.verified || "Verified")
                        : resource.verificationStatus ===
                          "example"
                        ? "Example only"
                        : resource.verificationStatus ===
                          "rejected"
                        ? (gf.notApproved || "Not approved")
                        : (gf.verificationPending || "Verification pending")}
                    </span>

                    <span className="government-record-status">
                      {translateLabel(resource.status)}
                    </span>

                    {resource.lastReviewed && (
                      <small>
                        {gf.reviewed || "Reviewed:"} {resource.lastReviewed}
                      </small>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="government-empty">
              <span>
                ⌕
              </span>

              <h3>
                {gf.noResults || "No matching resources"}
              </h3>

              <p>
                {gf.emptyDesc || "Try changing the search or category filter."}
              </p>

              <button
                type="button"
                onClick={resetFilters}
              >
                {gf.clearFilters || "Clear filters"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          HOW TO USE THIS PAGE
      ====================================================== */}

      <section className="government-how">
        <div className="government-container">
          <div className="government-heading">
            <div>
              <span>
                {gf.howEyebrow || "How This Section Works"}
              </span>

              <h2>
                {gf.howTitle || "Use official information to take the next step."}
              </h2>
            </div>
          </div>

          <div className="government-how-grid">
            <div>
              <span>
                01
              </span>

              <h3>
                {gf.step1Title || "Find a relevant resource"}
              </h3>

              <p>
                {gf.step1Desc || "Search the available programmes and information based on your needs."}
              </p>
            </div>

            <div>
              <span>
                02
              </span>

              <h3>
                {gf.step2Title || "Check basic eligibility"}
              </h3>

              <p>
                {gf.step2Desc || "Review the available eligibility information before continuing."}
              </p>
            </div>

            <div>
              <span>
                03
              </span>

              <h3>
                {gf.step3Title || "Continue to the official agency"}
              </h3>

              <p>
                {gf.step3Desc || "Use the official contact details or website for final information, applications and decisions."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL NOTICE
      ====================================================== */}

      <section className="government-final-notice">
        <div className="government-container">
          <div className="government-final-notice-box">
            <span className="government-notice-icon">
              i
            </span>

            <div>
              <strong>
                {gf.noticeTitle || "External Programme Notice"}
              </strong>

              <p>
                {gf.noticeText || "Programme availability, eligibility and application requirements are determined by the responsible government agency or external provider. Dementia Care Connect provides navigation and information only."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default GovernmentFinancial;