    import { useState } from "react";
    import { Link } from "react-router-dom";
    import "./Header.css";
    import rotaryLogo from "../../assets/rotary-logo.jpeg";

    const menuItems = [
    {
    label: "Understand Dementia",
    path: "/understand-dementia",
    children: [
        "What is Dementia?",
        "Alzheimer's Disease",
        "Signs & Changes",
        "Why These Changes Matter",
        "When to Seek Medical Advice",
        "Healthy Ageing & Risk Reduction",
    ],
    },
    {
    label: "Find Help",
    path: "/find-help",
    children: [
        "Healthcare Resources",
        "Financial Resources",
        "Equipment & Daily Living Resources",
        "Find Services Near You",
    ],
    },
    {
    label: "Caregiver Support",
    path: "/caregiver-support",
    children: [
        "Supporting Someone with Dementia",
        "Caregiver Wellbeing",
        "Support Resources",
        "Learning Resources",
    ],
    },
    {
    label: "Learn & Events",
    path: "/learn-events",
    children: [
        "Dementia Education",
        "Training Resources",
        "Webinars",
        "Certified Trainer Events",
    ],
    },
    {
    label: "About Us",
    path: "/about",
    children: [
        "About the Project",
        "Where to Find Us",
        "Contact Us",
        "Support the Project",
    ],
    },
    ];

    function Header() {
    const [openMenu, setOpenMenu] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
    <header className="site-header">
        <div className="top-bar">
        <div className="header-container top-bar-inner">
            <span>Dementia & Alzheimer's Information and Support</span>

            <div className="top-actions">
            <button>Search</button>
            <button>English ▼</button>
            </div>
        </div>
        </div>

        <div className="main-header">
        <div className="header-container main-header-inner">
            <Link to="/" className="brand">
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

            <nav className="desktop-nav">
            <Link to="/" className="nav-link">
                Home
            </Link>

            {menuItems.map((item) => (
                <div
                className="nav-item"
                key={item.label}
                onMouseEnter={() => setOpenMenu(item.label)}
                onMouseLeave={() => setOpenMenu(null)}
                >
                <Link to={item.path} className="nav-link">
                    {item.label} <span>⌄</span>
                </Link>

                {openMenu === item.label && (
                    <div className="dropdown-menu">
                    <h3>{item.label}</h3>

                    <div className="dropdown-grid">
                    {item.children.map((child) => (
                        <a href="#" key={child}>
                        {child}
                        </a>
                    ))}
                    </div>
                </div>
                )}
            </div>
            ))}
        </nav>

        <Link to="/find-help" className="support-btn">
            Get Support
        </Link>

        <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
        >
            ☰
        </button>
        </div>

        {mobileOpen && (
        <div className="mobile-nav">
            <Link to="/">Home</Link>

            {menuItems.map((item) => (
            <details key={item.label}>
                <summary>{item.label}</summary>

                <div className="mobile-submenu">
                {item.children.map((child) => (
                    <a href="#" key={child}>
                    {child}
                    </a>
                ))}
                </div>
            </details>
            ))}
        </div>
        )}
    </div>
    </header>
    );
    }

    export default Header;