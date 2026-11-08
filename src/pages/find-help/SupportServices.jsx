import PublishedRecords from "../../components/PublishedRecords";
import { useMemo, useState } from "react";

import supportServices from "../../data/supportServices";
import { useLanguage } from "../../i18n/LanguageContext";

import "./SupportServices.css";

const categories = [
  "All",
  "Pharmacy",
  "Occupational Therapy",
  "Physiotherapy / Rehabilitation",
  "Home / Community Care",
  "Respite / Elderly Care",
  "Support Group / NGO",
];

const cities = [
  "All",
  "Kuching",
  "Bintulu",
  "Miri",
  "Sibu",
];


function SupportServiceIcon({ category = "" }) {
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

  if (category.includes("Pharmacy")) {
    return <svg {...common}><path d="M6 3h12v18H6z" /><path d="M9 8h6M12 5v6" /></svg>;
  }
  if (category.includes("Occupational")) {
    return <svg {...common}><circle cx="12" cy="5" r="2" /><path d="M12 8v6M8 21l4-7 4 7M8 12h8" /></svg>;
  }
  if (category.includes("Physio")) {
    return <svg {...common}><circle cx="8" cy="5" r="2" /><path d="m8 8 3 4 4-1M11 12l-3 6M11 12l5 6" /></svg>;
  }
  if (category.includes("Home")) {
    return <svg {...common}><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10" /><path d="M9 21v-6h6v6" /></svg>;
  }
  if (category.includes("Respite")) {
    return <svg {...common}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>;
  }
  return <svg {...common}><circle cx="8" cy="8" r="2" /><circle cx="16" cy="8" r="2" /><path d="M4 18c1-3 2.5-5 4-5s3 2 4 5M12 18c1-3 2.5-5 4-5s3 2 4 5" /></svg>;
}

function SupportServices() {
  const { t } = useLanguage();
  const ss = t.supportServicesPage || {};

  const [search, setSearch] = useState("");

  const [category, setCategory] =
    useState("All");

  const [city, setCity] =
    useState("All");

  const filteredServices = useMemo(() => {
    return supportServices.filter((service) => {
      const searchableText = `
        ${service.name}
        ${service.service}
        ${service.specialistField}
        ${service.category}
        ${service.city}
        ${service.state}
      `.toLowerCase();

      const matchesSearch =
        searchableText.includes(
          search.toLowerCase()
        );

      const matchesCategory =
        category === "All" ||
        service.category === category;

      const matchesCity =
        city === "All" ||
        service.city === city;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCity
      );
    });
  }, [
    search,
    category,
    city,
  ]);

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setCity("All");
  };

  return (
    <main className="support-services-page">
      <PublishedRecords kind="organisations" category="services" title={ss.publishedTitle || "Published directory records"} />
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="support-services-hero">
        <div className="support-services-container">
          <span className="support-services-kicker">
            {ss.kicker || "Find Help & Support"}
          </span>

          <h1>
            {ss.title || "Support Services Directory"}
          </h1>

          <p>
            {ss.subtitle || "Browse available external support services and providers by service type and location."}
          </p>
        </div>
      </section>

      {/* =====================================================
          DIRECTORY
      ====================================================== */}

      <section className="support-services-main">
        <div className="support-services-container">
          <div className="support-services-heading">
            <div>
              <span>
                {ss.categoriesEyebrow || t.header?.menu?.supportServices || "Support Services"}
              </span>

              <h2>
                {ss.directoryHeading || "Find the type of support you need."}
              </h2>
            </div>

            <p>
              {ss.directorySub || "Search and filter available listings by service type and location."}
            </p>
          </div>

          {/* FILTERS */}

          <div className="support-services-toolbar">
            <div className="support-search-box">
              <span aria-hidden="true">
                ⌕
              </span>

              <input
                type="search"
                placeholder={ss.searchPlaceholder || "Search provider or service"}
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              aria-label="Filter by service category"
            >
              {categories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item === "All"
                      ? (ss.allServices || "All service types")
                      : item}
                  </option>
                )
              )}
            </select>

            <select
              value={city}
              onChange={(event) =>
                setCity(
                  event.target.value
                )
              }
              aria-label="Filter by city"
            >
              {cities.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item === "All"
                      ? (ss.allCities || "All locations")
                      : item}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              className="support-reset-button"
              onClick={resetFilters}
            >
              {ss.reset || "Reset"}
            </button>
          </div>

          {/* RESULT COUNT */}

          <div className="support-results-summary">
            <span>
              {ss.showing || "Showing"}
            </span>

            <strong>
              {
                filteredServices.length
              }
            </strong>

            <span>
              {filteredServices.length ===
              1
                ? (ss.serviceLabel || "service")
                : (ss.servicesLabel || "services")}
            </span>
          </div>

          {/* RESULTS */}

          {filteredServices.length >
          0 ? (
            <div className="support-services-grid">
              {filteredServices.map(
                (service) => (
                  <article
                    key={service.id}
                    className="support-service-card"
                  >
                    <div className="support-service-visual" aria-hidden="true">
                      <SupportServiceIcon category={service.category} />
                    </div>

                    <div className="support-service-card-top">
                      <span className="support-service-category">
                        {
                          service.category
                        }
                      </span>

                      <span className="support-service-location">
                        ◎ {service.city}
                      </span>
                    </div>

                    <h3>
                      {service.name}
                    </h3>

                    <p className="support-service-description">
                      {
                        service.service
                      }
                    </p>

                    <div className="support-service-details">
                      <div>
                        <span>
                          {ss.labelLocation || "Location"}
                        </span>

                        <strong>
                          {
                            service.address
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          {ss.labelSpecialist || "Specialist field"}
                        </span>

                        <strong>
                          {
                            service.specialistField
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          {ss.labelPhone || "Phone"}
                        </span>

                        <strong>
                          {service.phone ||
                            (ss.pending || "Pending")}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {ss.labelEmail || "Email"}
                        </span>

                        <strong>
                          {service.email ||
                            (ss.pending || "Pending")}
                        </strong>
                      </div>
                    </div>

                    {/* ADMIN / VERIFICATION STATUS */}

                    <div className="support-service-status">
                      <span
                        className={`service-status service-status-${service.verificationStatus}`}
                      >
                        {service.verificationStatus ===
                        "verified"
                          ? (ss.verified || "Verified")
                          : service.verificationStatus ===
                            "rejected"
                          ? (ss.notApproved || "Not approved")
                          : (ss.verificationPending || "Verification pending")}
                      </span>

                      {service.lastReviewed && (
                        <small>
                          {ss.lastReviewed || "Last reviewed:"}{" "}
                          {
                            service.lastReviewed
                          }
                        </small>
                      )}
                    </div>

                    {/* PUBLICATION STATE */}

                    <div className="support-publication-state">
                      <span>
                        {ss.recordStatus || "Record status"}
                      </span>

                      <strong>
                        {service.status}
                      </strong>
                    </div>
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="support-services-empty">
              <span>
                ⌕
              </span>

              <h3>
                {ss.noResults || "No matching services"}
              </h3>

              <p>
                {ss.emptyDesc || "Try changing your search or filter selection."}
              </p>

              <button
                type="button"
                onClick={
                  resetFilters
                }
              >
                {ss.clearFilters || "Clear filters"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          CATEGORIES
      ====================================================== */}

      <section className="support-services-categories">
        <div className="support-services-container">
          <div className="support-services-heading">
            <div>
              <span>
                {ss.categoriesEyebrow || "Service Categories"}
              </span>

              <h2>
                {ss.categoriesTitle || "What can you find here?"}
              </h2>
            </div>
          </div>

          <div className="support-category-grid">
            {categories
              .filter(
                (item) =>
                  item !== "All"
              )
              .map(
                (
                  item,
                  index
                ) => (
                  <button
                    key={item}
                    type="button"
                    className="support-category-card"
                    onClick={() => {
                      setCategory(
                        item
                      );

                      document
                        .querySelector(
                          ".support-services-main"
                        )
                        ?.scrollIntoView(
                          {
                            behavior:
                              "smooth",
                          }
                        );
                    }}
                  >
                    <span>
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <h3>
                      {item}
                    </h3>

                    <strong>
                      {ss.viewServices || "View services →"}
                    </strong>
                  </button>
                )
              )}
          </div>
        </div>
      </section>

      {/* =====================================================
          ADMIN-READY EXPLANATION
      ====================================================== */}

      <section className="support-admin-ready">
        <div className="support-services-container">
          <div className="support-admin-ready-box">
            <div>
              <span>
                {ss.adminEyebrow || "Admin-ready structure"}
              </span>

              <h2>
                {ss.adminTitle || "Directory content can be managed centrally."}
              </h2>

              <p>
                {ss.adminDesc || "Service information is separated from the page interface. When the Admin module and backend are added, administrators will be able to add, edit, verify, publish and archive directory records without changing the public page code."}
              </p>
            </div>

            <div className="support-admin-fields">
              <span>
                {ss.adminProvider || "Provider"}
              </span>

              <span>
                {ss.adminCategory || "Category"}
              </span>

              <span>
                {ss.adminLocation || "Location"}
              </span>

              <span>
                {ss.adminContact || "Contact"}
              </span>

              <span>
                {ss.adminVerification || "Verification"}
              </span>

              <span>
                {ss.adminStatus || "Publication status"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          NOTICE
      ====================================================== */}

      <section className="support-services-notice">
        <div className="support-services-container">
          <div className="support-services-notice-box">
            <span className="support-notice-icon">
              i
            </span>

            <div>
              <strong>
                {ss.disclaimerTitle || "Directory Listing Notice"}
              </strong>

              <p>
                {ss.disclaimerP1 || "Dementia Care Connect provides information and navigation to external providers. Inclusion in this directory does not constitute endorsement, recommendation or guarantee by RCBC."}
              </p>

              <p>
                {ss.disclaimerP2 || "Provider information should be verified and periodically reviewed before public publication."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default SupportServices;