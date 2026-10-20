import PublishedRecords from "../../components/PublishedRecords";
// src/pages/find-help/EquipmentPractical.jsx

import { useEffect, useMemo, useState } from "react";

import equipmentResources from "../../data/equipmentResources";
import { useLanguage } from "../../i18n/LanguageContext";

import "./EquipmentPractical.css";

const categoryIcons = {
  "Daily Living Aids": "✦",
  "Medication Support": "+",
  "Orientation & Reminders": "◷",
  "Mobility & Safety Aids": "↗",
  "Assistive Technology": "⌁",
};

const heroCards = [
  {
    id: "daily",
    number: "01",
    title: "Daily Living",
    category: "Daily Living Aids",
    className: "hero-card-daily",
  },
  {
    id: "reminders",
    number: "02",
    title: "Reminders",
    category: "Orientation & Reminders",
    className: "hero-card-reminders",
  },
  {
    id: "mobility",
    number: "03",
    title: "Mobility",
    category: "Mobility & Safety Aids",
    className: "hero-card-mobility",
  },
];

function EquipmentPractical() {
  const { t } = useLanguage();
  const ep = t.equipmentPracticalPage || {};

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [openResource, setOpenResource] =
    useState(null);

  const [heroRotation, setHeroRotation] =
    useState(0);

  const [heroPaused, setHeroPaused] =
    useState(false);

  /* =========================================================
     AUTOMATIC HERO CARD ROTATION
  ========================================================= */

  useEffect(() => {
    if (heroPaused) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setHeroRotation((current) =>
        (current + 1) % 3
      );
    }, 2800);

    return () => {
      window.clearInterval(interval);
    };
  }, [heroPaused]);

  /* =========================================================
     CATEGORIES
  ========================================================= */

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        equipmentResources.map(
          (resource) => resource.category
        )
      ),
    ];
  }, []);

  const filteredResources = useMemo(() => {
    if (selectedCategory === "All") {
      return equipmentResources;
    }

    return equipmentResources.filter(
      (resource) =>
        resource.category === selectedCategory
    );
  }, [selectedCategory]);

  /* =========================================================
     RESOURCE ACCORDION
  ========================================================= */

  const toggleResource = (id) => {
    setOpenResource(
      openResource === id ? null : id
    );
  };

  /* =========================================================
     HERO CARD POSITION
  ========================================================= */

  const getHeroPosition = (index) => {
    const position =
      (index - heroRotation + 3) % 3;

    if (position === 0) {
      return "hero-position-main";
    }

    if (position === 1) {
      return "hero-position-top";
    }

    return "hero-position-bottom";
  };

  const handleHeroCardClick = (
    category,
    index
  ) => {
    setHeroRotation(index);

    setSelectedCategory(category);

    window.setTimeout(() => {
      document
        .getElementById(
          "equipment-explore"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 150);
  };

  /* =========================================================
     QUICK NEED SELECTION
  ========================================================= */

  const selectCategoryAndScroll = (
    category
  ) => {
    setSelectedCategory(category);

    window.setTimeout(() => {
      document
        .getElementById(
          "equipment-explore"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  return (
    <main className="equipment-page">
      <PublishedRecords kind="organisations" category="equipment" title="Published directory records" />
      {/* =====================================================
          SPLIT HERO
      ====================================================== */}

      <section className="equipment-hero">
        <div className="equipment-hero-left">
          <div className="equipment-hero-content">
            <span className="equipment-eyebrow">
              {ep.kicker || "Find Help & Support"}
            </span>

            <h1>
              {ep.title || "Equipment & Practical Resources"}
            </h1>

            <p>
              {ep.subtitle || "Explore everyday aids, reminder tools, mobility equipment and assistive technology that may support daily life."}
            </p>

            <a
              href="#equipment-explore"
              className="equipment-hero-button"
            >
              {ep.exploreBtn || "Explore resources"}

              <span>
                ↓
              </span>
            </a>
          </div>
        </div>

        {/* =================================================
            INTERACTIVE ROTATING CARDS
        ================================================= */}

        <div
          className="equipment-hero-right"
          onMouseEnter={() =>
            setHeroPaused(true)
          }
          onMouseLeave={() =>
            setHeroPaused(false)
          }
        >
          <div className="equipment-hero-cards">
            {heroCards.map(
              (card, index) => (
                <button
                  key={card.id}
                  type="button"
                  className={`
                    equipment-moving-card
                    ${card.className}
                    ${getHeroPosition(index)}
                  `}
                  onClick={() =>
                    handleHeroCardClick(
                      card.category,
                      index
                    )
                  }
                  aria-label={`Explore ${card.title}`}
                >
                  <span className="equipment-moving-number">
                    {card.number}
                  </span>

                  <strong>
                    {card.title}
                  </strong>

                  <span className="equipment-moving-arrow">
                    ↗
                  </span>
                </button>
              )
            )}
          </div>

          <div className="equipment-hero-card-controls">
            {heroCards.map(
              (card, index) => (
                <button
                  key={card.id}
                  type="button"
                  aria-label={`Show ${card.title}`}
                  className={
                    heroRotation === index
                      ? "equipment-dot-active"
                      : ""
                  }
                  onClick={() =>
                    setHeroRotation(index)
                  }
                />
              )
            )}

            <span>
              {ep.hoverPause || "Hover to pause"}
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          START FROM THE PROBLEM
      ====================================================== */}

      <section className="equipment-needs">
        <div className="equipment-container">
          <div className="equipment-needs-heading">
            <span>
              {ep.needsEyebrow || "Start with the need"}
            </span>

            <h2>
              {ep.needsTitle || "What are you trying to make easier?"}
            </h2>

            <p>
              {ep.needsDesc || "Choose the area that best matches the practical challenge you are looking at."}
            </p>
          </div>

          <div className="equipment-needs-grid">
            <button
              type="button"
              onClick={() =>
                selectCategoryAndScroll(
                  "Daily Living Aids"
                )
              }
            >
              <span className="equipment-need-number">
                01
              </span>

              <h3>
                {ep.need1Title || "Everyday tasks"}
              </h3>

              <p>
                {ep.need1Desc || "Practical support for common daily activities and routines."}
              </p>

              <strong>
                {ep.need1Btn || "View aids →"}
              </strong>
            </button>

            <button
              type="button"
              onClick={() =>
                selectCategoryAndScroll(
                  "Medication Support"
                )
              }
            >
              <span className="equipment-need-number">
                02
              </span>

              <h3>
                {ep.need2Title || "Remembering medication"}
              </h3>

              <p>
                {ep.need2Desc || "Tools for organising and reminding medication routines."}
              </p>

              <strong>
                {ep.need2Btn || "View tools →"}
              </strong>
            </button>

            <button
              type="button"
              onClick={() =>
                selectCategoryAndScroll(
                  "Orientation & Reminders"
                )
              }
            >
              <span className="equipment-need-number">
                03
              </span>

              <h3>
                {ep.need3Title || "Time & orientation"}
              </h3>

              <p>
                {ep.need3Desc || "Tools that may help with dates, routines and familiar information."}
              </p>

              <strong>
                {ep.need3Btn || "View tools →"}
              </strong>
            </button>

            <button
              type="button"
              onClick={() =>
                selectCategoryAndScroll(
                  "Mobility & Safety Aids"
                )
              }
            >
              <span className="equipment-need-number">
                04
              </span>

              <h3>
                {ep.need4Title || "Moving around"}
              </h3>

              <p>
                {ep.need4Desc || "Practical equipment that may support mobility and movement."}
              </p>

              <strong>
                {ep.need4Btn || "View aids →"}
              </strong>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          RESOURCE EXPLORER
      ====================================================== */}

      <section
        className="equipment-explorer"
        id="equipment-explore"
      >
        <div className="equipment-container">
          <div className="equipment-explorer-layout">
            {/* LEFT SIDEBAR */}

            <aside className="equipment-category-panel">
              <span className="equipment-small-label">
                {ep.browseCategory || "Browse by category"}
              </span>

              <h2>
                {ep.practicalResources || "Practical resources"}
              </h2>

              <div className="equipment-category-list">
                {categories.map(
                  (category) => (
                    <button
                      type="button"
                      key={category}
                      className={
                        selectedCategory ===
                        category
                          ? "equipment-category-active"
                          : ""
                      }
                      onClick={() =>
                        setSelectedCategory(
                          category
                        )
                      }
                    >
                      <span>
                        {category === "All"
                          ? "◎"
                          : categoryIcons[
                              category
                            ]}
                      </span>

                      {category === "All"
                        ? (ep.allResources || "All resources")
                        : category}
                    </button>
                  )
                )}
              </div>

              <div className="equipment-sidebar-note">
                <strong>
                  {ep.homeSafetyNoteTitle || "Looking for home safety guidance?"}
                </strong>

                <p>
                  {ep.homeSafetyNoteText || "Home safety guidance belongs under Caregiver Support and is kept separate from this equipment section."}
                </p>
              </div>
            </aside>

            {/* RIGHT CONTENT */}

            <div className="equipment-resource-area">
              <div className="equipment-resource-heading">
                <div>
                  <span>
                    {selectedCategory === "All"
                      ? (ep.allResources || "All resources")
                      : selectedCategory}
                  </span>

                  <h2>
                    {ep.explorePracticalOptions || "Explore practical options"}
                  </h2>
                </div>

                <strong>
                  {
                    filteredResources.length
                  }{" "}
                  {filteredResources.length ===
                  1
                    ? (ep.categorySingular || "category")
                    : (ep.categoryPlural || "categories")}
                </strong>
              </div>

              <div className="equipment-resource-list">
                {filteredResources.map(
                  (
                    resource,
                    index
                  ) => {
                    const isOpen =
                      openResource ===
                      resource.id;

                    return (
                      <article
                        key={
                          resource.id
                        }
                        className={`equipment-resource-card ${
                          isOpen
                            ? "equipment-resource-open"
                            : ""
                        }`}
                      >
                        <button
                          type="button"
                          className="equipment-resource-header"
                          onClick={() =>
                            toggleResource(
                              resource.id
                            )
                          }
                          aria-expanded={
                            isOpen
                          }
                        >
                          <div className="equipment-resource-icon">
                            {
                              categoryIcons[
                                resource
                                  .category
                              ]
                            }
                          </div>

                          <div className="equipment-resource-title">
                            <span>
                              {String(
                                index + 1
                              ).padStart(
                                2,
                                "0"
                              )}
                              {" / "}
                              {
                                resource.category
                              }
                            </span>

                            <h3>
                              {
                                resource.title
                              }
                            </h3>

                            <p>
                              {
                                resource.shortDescription
                              }
                            </p>
                          </div>

                          <span className="equipment-resource-toggle">
                            {isOpen
                              ? "−"
                              : "+"}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="equipment-resource-details">
                            <div className="equipment-examples">
                              <span>
                                {ep.examples || "Examples"}
                              </span>

                              <ul>
                                {resource.examples.map(
                                  (
                                    example
                                  ) => (
                                    <li
                                      key={
                                        example
                                      }
                                    >
                                      {
                                        example
                                      }
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>

                            <div className="equipment-source-panel">
                              <span>
                                {ep.whereToFind || "Where can I find this?"}
                              </span>

                              <p>
                                {
                                  resource.whereToFind
                                }
                              </p>

                              {resource.supplierName ? (
                                <div className="equipment-supplier">
                                  <strong>
                                    {
                                      resource.supplierName
                                    }
                                  </strong>

                                  {resource.supplierPhone && (
                                    <span>
                                      {
                                        resource.supplierPhone
                                      }
                                    </span>
                                  )}

                                  {resource.supplierWebsite && (
                                    <a
                                      href={
                                        resource.supplierWebsite
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      {ep.visitSupplier || "Visit supplier ↗"}
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="equipment-pending">
                                  {ep.supplierPending || "Supplier information pending verification"}
                                </span>
                              )}
                            </div>

                            <div className="equipment-record-meta">
                              <span
                                className={`equipment-verification equipment-verification-${resource.verificationStatus}`}
                              >
                                {resource.verificationStatus ===
                                "verified"
                                  ? (ep.verified || "Verified")
                                  : (ep.verificationPending || "Verification pending")}
                              </span>

                              {resource.lastReviewed && (
                                <small>
                                  {ep.lastReviewed || "Last reviewed:"}{" "}
                                  {
                                    resource.lastReviewed
                                  }
                                </small>
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          GUIDANCE
      ====================================================== */}

      <section className="equipment-guidance">
        <div className="equipment-container">
          <div className="equipment-guidance-layout">
            <div>
              <span>
                {ep.guidanceEyebrow || "Before choosing equipment"}
              </span>

              <h2>
                {ep.guidanceTitle || "Start with the person, not the product."}
              </h2>
            </div>

            <div className="equipment-guidance-points">
              <div>
                <strong>
                  01
                </strong>

                <p>
                  {ep.guidance1 || "Identify the daily difficulty or need first."}
                </p>
              </div>

              <div>
                <strong>
                  02
                </strong>

                <p>
                  {ep.guidance2 || "Consider whether the person can use the equipment comfortably."}
                </p>
              </div>

              <div>
                <strong>
                  03
                </strong>

                <p>
                  {ep.guidance3 || "Where appropriate, seek advice from a qualified healthcare professional."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          BOUNDARY
      ====================================================== */}

      <section className="equipment-boundary">
        <div className="equipment-container">
          <div className="equipment-boundary-box">
            <span>
              i
            </span>

            <div>
              <strong>
                {ep.boundaryBoxTitle || "Information & Navigation Only"}
              </strong>

              <p>
                {ep.boundaryBoxText || "Dementia Care Connect provides practical information and links to relevant external resources. It does not prescribe equipment, provide clinical assessment or guarantee third-party products or suppliers."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default EquipmentPractical;