import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import rotaryLogo from "../../assets/rotary-logo.jpeg";

import SearchOverlay from "../Search/SearchOverlay";

import "./Header.css";

const menuItems = [
  /* =========================================================
     UNDERSTAND DEMENTIA
  ========================================================= */

  {
    label: "Understand Dementia",
    path: "/understand-dementia",

    children: [
      {
        label: "What is Dementia?",
        path: "/understand-dementia/what-is-dementia",
      },
      {
        label: "Alzheimer's Disease",
        path: "/understand-dementia/alzheimers",
      },
      {
        label: "Signs & Changes",
        path: "/understand-dementia/signs-and-changes",
      },
      {
        label: "Why These Changes Matter",
        path: "/understand-dementia/why-changes-matter",
      },
      {
        label: "When to Seek Medical Advice",
        path: "/understand-dementia/medical-advice",
      },
      {
        label: "Healthy Ageing & Risk Reduction",
        path: "/understand-dementia/healthy-ageing",
      },
    ],
  },

  /* =========================================================
     FIND HELP & SUPPORT
  ========================================================= */

  {
    label: "Find Help & Support",
    path: "/find-help",

    children: [
      {
        label: "Start From Where You Are",
        path: "/find-help",
      },
      {
        label: "Assessment & Healthcare",
        path: "/find-help/assessment-healthcare",
      },
      {
        label: "Support Services Directory",
        path: "/find-help/support-services",
      },
      {
        label: "Government & Financial Resources",
        path: "/find-help/government-financial",
      },
      {
        label: "Equipment & Practical Resources",
        path: "/find-help/equipment-practical",
      },
      {
        label: "Resource Finder",
        path: "/find-help/resource-finder",
      },
    ],
  },

  /* =========================================================
     CAREGIVER SUPPORT
  ========================================================= */

  {
    label: "Caregiver Support",
    path: "/caregiver-support",

    children: [
      {
        label: "Supporting Someone with Dementia",
        path: "/caregiver-support/supporting-someone",
      },
      {
        label: "Caregiver Wellbeing",
        path: "/caregiver-support/wellbeing",
      },
      {
        label: "Support Resources",
        path: "/find-help",
      },
      {
        label: "Learning Resources",
        path: "/learn-events",
      },
    ],
  },

  /* =========================================================
     LEARN & EVENTS
  ========================================================= */

  {
    label: "Learn & Events",
    menuOnly: true,

    children: [
      {
        label: "Dementia Education",
        path: "/learn-events/dementia-education",
      },
      {
        label: "Training Resources",
        path: "/learn-events/training-resources",
      },
      {
        label: "Webinars",
        path: "/learn-events/webinars",
      },
      {
        label: "Certified Trainer Events",
        path: "/learn-events/events",
      },
    ],
  },

  /* =========================================================
     ABOUT US
  ========================================================= */

  {
    label: "About Us",
    path: "/about",

    children: [
      {
        label: "About the Project",
        path: "/about",
      },
      {
        label: "Where to Find Us",
        path: "/about/locations",
      },
      {
        label: "Contact Us",
        path: "/about/contact",
      },
      {
        label: "Support the Project",
        path: "/about/support",
      },
    ],
  },
];

function Header() {
  const [openMenu, setOpenMenu] = useState(null);

  const [mobileOpen, setMobileOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  const [languageOpen, setLanguageOpen] = useState(false);

  const [showHeader, setShowHeader] = useState(false);

  /* =========================================================
     SHOW HEADER AFTER USER SCROLLS
  ========================================================= */

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

  /* =========================================================
     CLOSE MOBILE MENU
  ========================================================= */

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setOpenMenu(null);
  };

  return (
    <>
      <header
        className={`site-header ${
          showHeader
            ? "site-header-visible"
            : "site-header-hidden"
        }`}
      >
        {/* ===================================================
            TOP BAR
        =================================================== */}

        <div className="top-bar">
          <div className="header-container top-bar-inner">
            <span>
              Dementia & Alzheimer&apos;s Information and Support
            </span>

            <div className="top-actions">
              {/* SEARCH */}

              <button
                type="button"
                className="animated-search-button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search website"
              >
                <span
                  className="animated-search-icon"
                  aria-hidden="true"
                >
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
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                    />

                    <line
                      x1="16.5"
                      y1="16.5"
                      x2="21"
                      y2="21"
                    />
                  </svg>
                </span>

                <span className="animated-search-text">
                  Search
                </span>
              </button>

              {/* LANGUAGE */}

              <div className="language-wrapper">
                <button
                  type="button"
                  onClick={() =>
                    setLanguageOpen(!languageOpen)
                  }
                  aria-expanded={languageOpen}
                  aria-label="Select language"
                >
                  English ▼
                </button>

                {languageOpen && (
                  <div className="language-menu">
                    <button
                      type="button"
                      onClick={() =>
                        setLanguageOpen(false)
                      }
                    >
                      English
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setLanguageOpen(false)
                      }
                    >
                      Bahasa Melayu
                    </button>
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

            <Link
              to="/"
              className="brand"
              onClick={closeMobileMenu}
            >
              <img
                src={rotaryLogo}
                alt="Rotary International"
                className="brand-logo"
              />

              <div className="brand-text">
                <strong>
                  Dementia Care Hub
                </strong>

                <span>
                  Support • Learn • Connect
                </span>
              </div>
            </Link>

            {/* =================================================
                DESKTOP NAVIGATION
            ================================================= */}

            <nav
              className="desktop-nav"
              aria-label="Main navigation"
            >
              <Link
                to="/"
                className="nav-link"
                onClick={() =>
                  setOpenMenu(null)
                }
              >
                Home
              </Link>

              {menuItems.map((item) => (
                <div
                  className="nav-item"
                  key={item.label}
                  onMouseEnter={() =>
                    setOpenMenu(item.label)
                  }
                  onMouseLeave={() =>
                    setOpenMenu(null)
                  }
                >
                  {item.menuOnly ? (
                    <button
                      type="button"
                      className="nav-link nav-menu-trigger"
                      onClick={() =>
                        setOpenMenu(
                          openMenu === item.label
                            ? null
                            : item.label
                        )
                      }
                      onFocus={() =>
                        setOpenMenu(item.label)
                      }
                      aria-expanded={
                        openMenu === item.label
                      }
                      aria-haspopup="true"
                    >
                      {item.label}

                      <span aria-hidden="true">
                        ⌄
                      </span>
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className="nav-link"
                    >
                      {item.label}

                      <span aria-hidden="true">
                        ⌄
                      </span>
                    </Link>
                  )}

                  {/* DROPDOWN */}

                  {openMenu === item.label && (
                    <div className="dropdown-menu">
                      <h3>
                        {item.label}
                      </h3>

                      <div className="dropdown-grid">
                        {item.children.map(
                          (child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={() =>
                                setOpenMenu(null)
                              }
                            >
                              {child.label}
                            </Link>
                          )
                        )}
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
              Get Support
            </Link>

            {/* MOBILE MENU BUTTON */}

            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() =>
                setMobileOpen(!mobileOpen)
              }
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
            <nav
              className="mobile-nav"
              aria-label="Mobile navigation"
            >
              <Link
                to="/"
                onClick={closeMobileMenu}
              >
                Home
              </Link>

              {menuItems.map((item) => (
                <details key={item.label}>
                  <summary>
                    {item.label}
                  </summary>

                  <div className="mobile-submenu">
                    {!item.menuOnly && (
                      <Link
                        to={item.path}
                        onClick={closeMobileMenu}
                      >
                        Overview
                      </Link>
                    )}

                    {item.children.map(
                      (child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={
                            closeMobileMenu
                          }
                        >
                          {child.label}
                        </Link>
                      )
                    )}
                  </div>
                </details>
              ))}

              <Link
                to="/find-help"
                className="mobile-support-link"
                onClick={closeMobileMenu}
              >
                Get Support
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* =====================================================
          SEARCH OVERLAY
      ====================================================== */}

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() =>
          setSearchOpen(false)
        }
      />
    </>
  );
}

export default Header;