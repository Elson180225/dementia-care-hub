import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import rotaryLogo from "../../assets/rotary-logo.jpeg";
import SearchOverlay from "../Search/SearchOverlay";
import { useLanguage } from "../../i18n/LanguageContext";
import "./Header.css";

function getMenuItems(m) {
  return [
    {
      label: m.understand,
      path: "/understand-dementia",
      children: [
        {
          label: m.whatIsDementia,
          path: "/understand-dementia#overview",
        },
        {
          label: m.alzheimers,
          path: "/understand-dementia#common-types",
        },
        {
          label: m.signsChanges,
          path: "/understand-dementia#early-signs",
        },
        {
          label: m.whyChangesMatter,
          path: "/understand-dementia#why-changes-matter",
        },
        {
          label: m.medicalAdvice,
          path: "/understand-dementia#medical-advice",
        },
        {
          label: m.healthyAgeing,
          path: "/understand-dementia#healthy-living",
        },
      ],
    },
    {
      label: m.findHelp,
      path: "/find-help",
      children: [
        {
          label: m.startWhereYouAre,
          path: "/find-help",
        },
        {
          label: m.assessmentHealthcare,
          path: "/find-help/assessment-healthcare",
        },
        {
          label: m.supportServices,
          path: "/find-help/support-services",
        },
        {
          label: m.govtFinancial,
          path: "/find-help/government-financial",
        },
        {
          label: m.equipmentPractical,
          path: "/find-help/equipment-practical",
        },
        {
          label: m.resourceFinder,
          path: "/find-help/resource-finder",
        },
      ],
    },
    {
      label: m.caregiverSupport,
      path: "/caregiver-support",
      children: [
        {
          label: m.caregiverGuidance,
          path: "/caregiver-support",
        },
        {
          label: m.caregiverTraining,
          path: "/caregiver-support/training",
        },
        {
          label: m.certVerification,
          path: "/caregiver-support/certificate-verification",
        },
        {
          label: m.supportGroups,
          path: "/caregiver-support/support-groups",
        },
        {
          label: m.volunteer,
          path: "/caregiver-support/volunteer",
        },
      ],
    },
    {
      label: m.learnEvents,
      path: "/learn-events",
      menuOnly: true,
      children: [
        {
          label: m.onlineEducation,
          path: "/learn-events/online-education",
        },
        {
          label: m.physicalEducation,
          path: "/learn-events/physical-education",
        },
        {
          label: m.events,
          path: "/learn-events/events",
        },
        {
          label: m.certifiedTrainers,
          path: "/learn-events/certified-trainers",
        },
        {
          label: m.upcomingCalendar,
          path: "/learn-events/upcoming-calendar",
        },
      ],
    },
    {
      label: m.aboutProject,
      path: "/about",
      children: [
        {
          label: m.aboutProject,
          path: "/about",
        },
        {
          label: m.contactUs,
          path: "/about/contact",
        },
      ],
    },
  ];
}


function HelpMenuIcon({ path }) {
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

  if (path === "/find-help") {
    return (
      <svg {...common}>
        <path d="M5 18c2.5-4 5-5.5 8-5.5h2.5" />
        <circle cx="5" cy="18" r="2" />
        <path d="M15 6.5a3.5 3.5 0 1 1 7 0c0 2.6-3.5 6-3.5 6S15 9.1 15 6.5Z" />
        <circle cx="18.5" cy="6.5" r=".8" />
      </svg>
    );
  }

  if (path.includes("assessment-healthcare")) {
    return (
      <svg {...common}>
        <path d="M6 3v5a4 4 0 0 0 8 0V3" />
        <path d="M4 3h4M12 3h4" />
        <path d="M10 12v2a5 5 0 0 0 10 0v-1" />
        <circle cx="20" cy="10" r="2" />
      </svg>
    );
  }

  if (path.includes("support-services") || path.includes("support-groups")) {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="2.2" />
        <circle cx="16" cy="8" r="2.2" />
        <path d="M3.5 18c.7-3.2 2.5-5 4.5-5s3.8 1.8 4.5 5" />
        <path d="M11.5 18c.7-3.2 2.5-5 4.5-5s3.8 1.8 4.5 5" />
        <path d="M7 19h10" />
      </svg>
    );
  }

  if (path.includes("government-financial")) {
    return (
      <svg {...common}>
        <path d="M3 9h18L12 3 3 9Z" />
        <path d="M5 10v7M9 10v7M15 10v7M19 10v7" />
        <path d="M3 18h18M2 21h20" />
      </svg>
    );
  }

  if (path.includes("equipment-practical")) {
    return (
      <svg {...common}>
        <circle cx="9" cy="5" r="2" />
        <path d="M9 8v5h5l2 5" />
        <path d="M9 11H6a4 4 0 1 0 4 6" />
        <path d="M14 13h4" />
      </svg>
    );
  }

  // Understanding Dementia
  if (path === "/understand-dementia") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6" />
        <circle cx="12" cy="7.5" r=".8" />
      </svg>
    );
  }

  if (path.includes("alzheimers")) {
    return (
      <svg {...common}>
        <path d="M10 3.5a2 2 0 1 1 4 0V5h4a1 1 0 0 1 1 1v4h-1.5a2 2 0 1 0 0 4H19v4a1 1 0 0 1-1 1h-4v-1.5a2 2 0 1 0-4 0V19H6a1 1 0 0 1-1-1v-4h1.5a2 2 0 1 0 0-4H5V6a1 1 0 0 1 1-1h4V3.5Z" />
      </svg>
    );
  }

  if (path.includes("signs-and-changes")) {
    return (
      <svg {...common}>
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (path.includes("why-changes-matter")) {
    return (
      <svg {...common}>
        <path d="M12 3 2.5 20h19L12 3Z" />
        <path d="M12 10v4.5" />
        <circle cx="12" cy="17" r=".8" />
      </svg>
    );
  }

  if (path.includes("medical-advice")) {
    return (
      <svg {...common}>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4V3h6v1" />
        <path d="M12 9v6M9 12h6" />
      </svg>
    );
  }

  if (path.includes("healthy-ageing")) {
    return (
      <svg {...common}>
        <path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.2 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
      </svg>
    );
  }

  // Caregiver Support
  if (path === "/caregiver-support") {
    return (
      <svg {...common}>
        <path d="M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5V5.5Z" />
        <path d="M12 6v13.5" />
      </svg>
    );
  }

  if (path.includes("/training")) {
    return (
      <svg {...common}>
        <path d="M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9Z" />
        <path d="M6.5 11v4.5c1.5 1.5 3.5 2.2 5.5 2.2s4-.7 5.5-2.2V11" />
        <path d="M21.5 9v5" />
      </svg>
    );
  }

  if (path.includes("certificate-verification")) {
    return (
      <svg {...common}>
        <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6L12 3Z" />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </svg>
    );
  }

  if (path.includes("/volunteer")) {
    return (
      <svg {...common}>
        <path d="M12 9.5s-3.5-2.2-3.5-4.6A2 2 0 0 1 12 3.8a2 2 0 0 1 3.5 1.1c0 2.4-3.5 4.6-3.5 4.6Z" />
        <path d="M3 14h3.5l3 2h4a1.5 1.5 0 0 1 0 3H9" />
        <path d="M13.5 17.5 18 15a1.6 1.6 0 0 1 2 2.4L14 21H6.5L3 19" />
      </svg>
    );
  }

  // Learn & Events
  if (path.includes("online-education")) {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
        <path d="m10.5 8 4 2-4 2V8Z" />
      </svg>
    );
  }

  if (path.includes("physical-education")) {
    return (
      <svg {...common}>
        <rect x="4" y="3.5" width="16" height="10" rx="1.5" />
        <path d="M8 21l2-7.5M16 21l-2-7.5" />
        <path d="M8 7.5h8M8 10h5" />
      </svg>
    );
  }

  if (path.includes("upcoming-calendar") || path.includes("/events")) {
    return (
      <svg {...common}>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
        {path.includes("/events") && <path d="m12 12.6.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3.9-1.8Z" />}
      </svg>
    );
  }

  if (path.includes("certified-trainers")) {
    return (
      <svg {...common}>
        <circle cx="10" cy="8" r="3.5" />
        <path d="M3.5 20c.8-3.6 3.3-5.5 6.5-5.5 1.4 0 2.6.3 3.6 1" />
        <path d="m15 18 2 2 4-4.5" />
      </svg>
    );
  }

  // About
  if (path === "/about") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v.01M11 11.5h1V17h1" />
      </svg>
    );
  }

  if (path.includes("contact")) {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
      <path d="M10.5 7.5c1.8 0 3 1.2 3 3" />
    </svg>
  );
}

function Header() {
  const { language, setLanguage, t, languages, currentLanguageConfig } =
    useLanguage();

  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(false);

  const languageWrapperRef = useRef(null);

  /* Close language menu when clicking outside */
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        languageWrapperRef.current &&
        !languageWrapperRef.current.contains(event.target)
      ) {
        setLanguageOpen(false);
      }
    };
    if (languageOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [languageOpen]);

  /* SHOW HEADER AFTER USER SCROLLS */
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 120) {
        setShowHeader(true);
      } else {
        setShowHeader(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setOpenMenu(null);
  };

  const menuItems = getMenuItems(t.header.menu);

  return (
    <>
      <header
        className={`site-header ${
          showHeader ? "site-header-visible" : "site-header-hidden"
        }`}
      >
        {/* ===================================================
            TOP BAR
        =================================================== */}
        <div className="top-bar">
          <div className="header-container top-bar-inner">
            <span>{t.header.topBar}</span>

            <div className="top-actions">
              <nav className="utility-nav" aria-label="Updates and trainer access">
                <Link to="/get-updated" onClick={closeMobileMenu}>GET UPDATED</Link>
                <span aria-hidden="true">|</span>
                <Link to="/trainer-portal" onClick={closeMobileMenu}>TRAINER PORTAL</Link>
              </nav>
              {/* SEARCH */}
              <button
                type="button"
                className="animated-search-button"
                onClick={() => setSearchOpen(true)}
                aria-label={t.header.search}
              >
                <span className="animated-search-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16.5" y1="16.5" x2="21" y2="21" />
                  </svg>
                </span>

                <span className="animated-search-text">{t.header.search}</span>
              </button>

              {/* LANGUAGE */}
              <div className="language-wrapper" ref={languageWrapperRef}>
                <button
                  type="button"
                  onClick={() => setLanguageOpen(!languageOpen)}
                  aria-expanded={languageOpen}
                  aria-label="Select language"
                >
                  {currentLanguageConfig.nativeLabel} ▼
                </button>

                {languageOpen && (
                  <div className="language-menu">
                    {languages.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        className={language === item.code ? "language-menu-active" : ""}
                        onClick={() => {
                          setLanguage(item.code);
                          setLanguageOpen(false);
                        }}
                      >
                        {item.nativeLabel} {language === item.code ? "✓" : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            MAIN HEADER
        =================================================== */}
        <div className="main-header">
          <div className="header-container main-header-inner">
            {/* BRAND */}
            <Link to="/" className="brand" onClick={closeMobileMenu}>
              <img
                src={rotaryLogo}
                alt="Rotary International"
                className="brand-logo"
              />
              <div className="brand-text">
                <strong>{t.header?.hubTitle || "Dementia Care Connect"}</strong>
                <span>{t.header?.hubSubtitle || "Support • Learn • Connect"}</span>
              </div>
            </Link>

            {/* =================================================
                DESKTOP NAVIGATION
            ================================================= */}
            <nav className="desktop-nav" aria-label="Main navigation">
              <Link
                to="/"
                className="nav-link"
                onClick={() => setOpenMenu(null)}
              >
                {t.header.home}
              </Link>

              {menuItems.map((item) => (
                <div
                  className="nav-item"
                  key={item.label}
                  onMouseEnter={() => setOpenMenu(item.label)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  {item.menuOnly ? (
                    <button
                      type="button"
                      className="nav-link nav-menu-trigger"
                      onClick={() =>
                        setOpenMenu(
                          openMenu === item.label ? null : item.label
                        )
                      }
                      onFocus={() => setOpenMenu(item.label)}
                      aria-expanded={openMenu === item.label}
                      aria-haspopup="true"
                    >
                      {item.label}
                      <span aria-hidden="true"> ⌄</span>
                    </button>
                  ) : (
                    <Link to={item.path} className="nav-link">
                      {item.label}
                      <span aria-hidden="true"> ⌄</span>
                    </Link>
                  )}

                  {/* DROPDOWN */}
                  {openMenu === item.label && (
                    <div className="dropdown-menu dropdown-menu-visual">
                      <div className="dropdown-heading-row">
                        <h3>{item.label}</h3>
                        <span className="dropdown-heading-line" aria-hidden="true" />
                      </div>

                      <div className="dropdown-grid">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className="dropdown-visual-link"
                            onClick={() => setOpenMenu(null)}
                          >
                            <span className="dropdown-visual-icon">
                              <HelpMenuIcon path={child.path} />
                            </span>

                            <span className="dropdown-visual-label">
                              {child.label}
                            </span>

                            <span
                              className="dropdown-visual-arrow"
                              aria-hidden="true"
                            >
                              ›
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* GET SUPPORT */}
            <Link
              to="/find-help"
              className="support-btn"
              onClick={closeMobileMenu}
            >
              {t.header.getSupport}
            </Link>

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? "×" : "☰"}
            </button>
          </div>

          {/* =================================================
              MOBILE NAVIGATION
          ================================================= */}
          {mobileOpen && (
            <nav className="mobile-nav" aria-label="Mobile navigation">
              <Link to="/" onClick={closeMobileMenu}>
                {t.header.home}
              </Link>

              {menuItems.map((item) => (
                <details key={item.label}>
                  <summary>{item.label}</summary>
                  <div className="mobile-submenu">
                    {!item.menuOnly && !["/understand-dementia", "/caregiver-support"].includes(item.path) && (
                      <Link to={item.path} onClick={closeMobileMenu}>
                        {t.header.overview}
                      </Link>
                    )}

                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        onClick={closeMobileMenu}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ))}

              <Link
                to="/find-help"
                className="mobile-support-link"
                onClick={closeMobileMenu}
              >
                {t.header.getSupport}
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* SEARCH OVERLAY */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}

export default Header;
