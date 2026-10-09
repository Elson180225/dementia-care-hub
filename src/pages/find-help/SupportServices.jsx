import { useMemo, useState } from "react";

import supportServices from "../../data/supportServices";

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

function SupportServices() {
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
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="support-services-hero">
        <div className="support-services-container">
          <span className="support-services-kicker">
            Find Help & Support
          </span>

          <h1>
            Support Services Directory
          </h1>

          <p>
            Browse available external support services and
            providers by service type and location.
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
                Browse Services
              </span>

              <h2>
                Find the type of support you need.
              </h2>
            </div>

            <p>
              Search and filter available listings by
              service type and location.
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
                placeholder="Search provider or service"
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
                      ? "All service types"
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
                      ? "All locations"
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
              Reset
            </button>
          </div>

          {/* RESULT COUNT */}

          <div className="support-results-summary">
            <span>
              Showing
            </span>

            <strong>
              {
                filteredServices.length
              }
            </strong>

            <span>
              {filteredServices.length ===
              1
                ? "service"
                : "services"}
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
                          Location
                        </span>

                        <strong>
                          {
                            service.address
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Specialist field
                        </span>

                        <strong>
                          {
                            service.specialistField
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Phone
                        </span>

                        <strong>
                          {service.phone ||
                            "Pending"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Email
                        </span>

                        <strong>
                          {service.email ||
                            "Pending"}
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
                          ? "Verified"
                          : service.verificationStatus ===
                            "rejected"
                          ? "Not approved"
                          : "Verification pending"}
                      </span>

                      {service.lastReviewed && (
                        <small>
                          Last reviewed:{" "}
                          {
                            service.lastReviewed
                          }
                        </small>
                      )}
                    </div>

                    {/* PUBLICATION STATE */}

                    <div className="support-publication-state">
                      <span>
                        Record status
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
                No matching services
              </h3>

              <p>
                Try changing your
                search or filter
                selection.
              </p>

              <button
                type="button"
                onClick={
                  resetFilters
                }
              >
                Clear filters
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
                Service Categories
              </span>

              <h2>
                What can you find here?
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
                      View services →
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
                Admin-ready structure
              </span>

              <h2>
                Directory content can be managed centrally.
              </h2>

              <p>
                Service information is separated from the
                page interface. When the Admin module and
                backend are added, administrators will be
                able to add, edit, verify, publish and
                archive directory records without changing
                the public page code.
              </p>
            </div>

            <div className="support-admin-fields">
              <span>
                Provider
              </span>

              <span>
                Category
              </span>

              <span>
                Location
              </span>

              <span>
                Contact
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
                Directory Listing Notice
              </strong>

              <p>
                Dementia Care Connect provides information
                and navigation to external providers.
                Inclusion in this directory does not
                constitute endorsement, recommendation or
                guarantee by RCBC.
              </p>

              <p>
                Provider information should be verified and
                periodically reviewed before public
                publication.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default SupportServices;