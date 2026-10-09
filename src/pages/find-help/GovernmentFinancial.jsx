import { useMemo, useState } from "react";

import governmentResources from "../../data/governmentResources";

import "./GovernmentFinancial.css";

const categories = [
  "All",
  "Government Support",
  "Financial Assistance",
  "Caregiver Support",
  "Older Persons",
];

function GovernmentFinancial() {
  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("All");

  const filteredResources = useMemo(() => {
    return governmentResources.filter((resource) => {
      const searchableText = `
        ${resource.title}
        ${resource.agency}
        ${resource.category}
        ${resource.location}
        ${resource.summary}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(
        search.toLowerCase()
      );

      const matchesCategory =
        category === "All" ||
        resource.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

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
        <div className="government-container">
          <span className="government-kicker">
            Find Help & Support
          </span>

          <h1>
            Government & Financial Resources
          </h1>

          <p>
            Find information about official government
            programmes, financial support and other external
            resources that may be relevant to you or your
            family.
          </p>
        </div>
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
                Information & Navigation Only
              </strong>

              <p>
                Dementia Care Connect does not provide
                government benefits, financial assistance or
                subsidies. This page helps users find relevant
                official information and the responsible
                external agency.
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
                Official Resource Navigation
              </span>

              <h2>
                Find relevant programmes and information.
              </h2>
            </div>

            <p>
              Search by programme, agency or support type.
            </p>
          </div>

          {/* FILTERS */}

          <div className="government-toolbar">
            <div className="government-search">
              <span aria-hidden="true">
                ⌕
              </span>

              <input
                type="search"
                placeholder="Search programmes or agencies"
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
              aria-label="Filter resource category"
            >
              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item === "All"
                    ? "All resource types"
                    : item}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="government-reset"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>

          {/* COUNT */}

          <div className="government-result-count">
            <span>
              Showing
            </span>

            <strong>
              {filteredResources.length}
            </strong>

            <span>
              {filteredResources.length === 1
                ? "resource"
                : "resources"}
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
                  <div className="government-card-top">
                    <span className="government-category">
                      {resource.category}
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
                      Responsible agency
                    </span>

                    <strong>
                      {resource.agency}
                    </strong>
                  </div>

                  <p className="government-summary">
                    {resource.summary}
                  </p>

                  {/* INFORMATION */}

                  <div className="government-info-grid">
                    <div>
                      <span>
                        Basic eligibility
                      </span>

                      <p>
                        {resource.eligibility}
                      </p>
                    </div>

                    <div>
                      <span>
                        How to access
                      </span>

                      <p>
                        {resource.access}
                      </p>
                    </div>
                  </div>

                  {/* CONTACT */}

                  <div className="government-contact">
                    <div>
                      <span>
                        Phone
                      </span>

                      <strong>
                        {resource.phone || "Pending"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Email
                      </span>

                      <strong>
                        {resource.email || "Pending"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Official website
                      </span>

                      {resource.website ? (
                        <a
                          href={resource.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Visit official source ↗
                        </a>
                      ) : (
                        <strong>
                          Pending
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
                        ? "Verified"
                        : resource.verificationStatus ===
                          "rejected"
                        ? "Not approved"
                        : "Verification pending"}
                    </span>

                    <span className="government-record-status">
                      {resource.status}
                    </span>

                    {resource.lastReviewed && (
                      <small>
                        Reviewed: {resource.lastReviewed}
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
                No matching resources
              </h3>

              <p>
                Try changing the search or category filter.
              </p>

              <button
                type="button"
                onClick={resetFilters}
              >
                Clear filters
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
                How This Section Works
              </span>

              <h2>
                Use official information to take the next step.
              </h2>
            </div>
          </div>

          <div className="government-how-grid">
            <div>
              <span>
                01
              </span>

              <h3>
                Find a relevant resource
              </h3>

              <p>
                Search the available programmes and information
                based on your needs.
              </p>
            </div>

            <div>
              <span>
                02
              </span>

              <h3>
                Check basic eligibility
              </h3>

              <p>
                Review the available eligibility information
                before continuing.
              </p>
            </div>

            <div>
              <span>
                03
              </span>

              <h3>
                Continue to the official agency
              </h3>

              <p>
                Use the official contact details or website for
                final information, applications and decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ADMIN READY
      ====================================================== */}

      <section className="government-admin">
        <div className="government-container">
          <div className="government-admin-box">
            <div>
              <span>
                Admin-ready structure
              </span>

              <h2>
                Resources can be managed without changing the page.
              </h2>

              <p>
                When the Admin module and backend are added,
                administrators can create, edit, verify,
                publish, archive and review government or
                financial resource records centrally.
              </p>
            </div>

            <div className="government-admin-fields">
              <span>
                Programme name
              </span>

              <span>
                Agency
              </span>

              <span>
                Category
              </span>

              <span>
                Eligibility
              </span>

              <span>
                Access information
              </span>

              <span>
                Official contact
              </span>

              <span>
                Verification
              </span>

              <span>
                Publication status
              </span>
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
                External Programme Notice
              </strong>

              <p>
                Programme availability, eligibility and
                application requirements are determined by the
                responsible government agency or external
                provider. Dementia Care Connect provides
                navigation and information only.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default GovernmentFinancial;