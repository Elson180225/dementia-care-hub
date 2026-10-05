import { useState } from "react";
import { Link } from "react-router-dom";

import rotaryLogo from "../../assets/rotary-logo.jpeg";

import SearchOverlay from "../Search/SearchOverlay";

import "./Header.css";

const menuItems = [
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

  {
    label: "Find Help",
    path: "/find-help",
    children: [
      {
        label: "Healthcare Resources",
        path: "/find-help/healthcare-resources",
      },
      {
        label: "Financial Resources",
        path: "/find-help/financial-resources",
      },
      {
        label: "Equipment & Daily Living",
        path: "/find-help/equipment-resources",
      },
      {
        label: "Services Near You",
        path: "/find-help/services",
      },
    ],
  },

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

  {
    label: "Learn & Events",
    path: "/learn-events",
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

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setOpenMenu(null);
  };

  return (
    <>
      <header className="site-header">
        {/* TOP BAR */}
        <div className="top-bar">
          <div className="header-container top-bar-inner">
            <span>
              Dementia & Alzheimer&apos;s Information and Support
            </span>

            <div className="top-actions">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search website"
              >
                Search
              </button>

              <div className="language-wrapper">
                <button
                  type="button"
                  onClick={() => setLanguageOpen(!languageOpen)}
                  aria-expanded={languageOpen}
                  aria-label="Select language"
                >
                  English ▼
                </button>

                {languageOpen && (
                  <div className="language-menu">
                    <button
                      type="button"
                      onClick={() => setLanguageOpen(false)}
                    >
                      English
                    </button>

                    <button
                      type="button"
                      onClick={() => setLanguageOpen(false)}
                    >
                      Bahasa Melayu
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN HEADER */}
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
                <strong>Dementia Care Hub</strong>
                <span>Support • Learn • Connect</span>
              </div>
            </Link>

            {/* DESKTOP NAV */}
            <nav
              className="desktop-nav"
              aria-label="Main navigation"
            >
              <Link
                to="/"
                className="nav-link"
                onClick={() => setOpenMenu(null)}
              >
                Home
              </Link>

              {menuItems.map((item) => (
                <div
                  className="nav-item"
                  key={item.label}
                  onMouseEnter={() => setOpenMenu(item.label)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <Link
                    to={item.path}
                    className="nav-link"
                  >
                    {item.label}

                    <span aria-hidden="true">
                      ⌄
                    </span>
                  </Link>

                  {openMenu === item.label && (
                    <div className="dropdown-menu">
                      <h3>{item.label}</h3>

                      <div className="dropdown-grid">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setOpenMenu(null)}
                          >
                            {child.label}
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
              Get Support
            </Link>

            {/* MOBILE BUTTON */}
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

          {/* MOBILE NAV */}
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
                    <Link
                      to={item.path}
                      onClick={closeMobileMenu}
                    >
                      Overview
                    </Link>

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
                Get Support
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