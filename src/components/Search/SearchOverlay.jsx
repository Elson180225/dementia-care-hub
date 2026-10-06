import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./SearchOverlay.css";

const searchItems = [
  {
    title: "What is Dementia?",
    description:
      "Learn what dementia is and how it can affect memory, thinking and daily life.",
    path: "/understand-dementia/what-is-dementia",
    category: "Understand Dementia",
    keywords: "dementia memory thinking symptoms information",
  },
  {
    title: "Alzheimer's Disease",
    description:
      "Learn about Alzheimer's disease, the most common form of dementia.",
    path: "/understand-dementia/alzheimers",
    category: "Understand Dementia",
    keywords: "alzheimer alzheimers disease dementia memory",
  },
  {
    title: "Signs & Changes",
    description:
      "Explore common memory, behaviour and daily functioning changes.",
    path: "/understand-dementia/signs-and-changes",
    category: "Understand Dementia",
    keywords: "signs changes symptoms memory behaviour behavior",
  },
  {
    title: "When to Seek Medical Advice",
    description:
      "Guidance on when changes may need assessment by a healthcare professional.",
    path: "/understand-dementia/medical-advice",
    category: "Understand Dementia",
    keywords: "doctor medical help assessment healthcare advice",
  },
  {
    title: "Healthy Ageing & Risk Reduction",
    description:
      "Information about healthy ageing and reducing dementia-related risks.",
    path: "/understand-dementia/healthy-ageing",
    category: "Understand Dementia",
    keywords: "healthy ageing aging risk reduction prevention health",
  },

  {
    title: "Healthcare Resources",
    description:
      "Find doctors, mental health professionals and healthcare organisations.",
    path: "/find-help/healthcare-resources",
    category: "Find Help",
    keywords: "doctor hospital healthcare mental health professional medical",
  },
  {
    title: "Financial Resources",
    description:
      "Explore organisations and financial resources you may consider contacting.",
    path: "/find-help/financial-resources",
    category: "Find Help",
    keywords: "financial money assistance funding resources support",
  },
  {
    title: "Equipment & Daily Living",
    description:
      "Find practical equipment and resources that may support daily living.",
    path: "/find-help/equipment-resources",
    category: "Find Help",
    keywords: "equipment daily living home safety resources",
  },
  {
    title: "Services Near You",
    description:
      "Explore available community services and support organisations.",
    path: "/find-help/services",
    category: "Find Help",
    keywords: "services location organisation organization community nearby",
  },

  {
    title: "Supporting Someone with Dementia",
    description:
      "Practical support for family members, friends and caregivers.",
    path: "/caregiver-support/supporting-someone",
    category: "Caregiver Support",
    keywords: "caregiver carer family support loved one",
  },
  {
    title: "Caregiver Wellbeing",
    description:
      "Resources focused on caregiver wellbeing and support.",
    path: "/caregiver-support/wellbeing",
    category: "Caregiver Support",
    keywords: "caregiver wellbeing wellness stress support family",
  },

  {
    title: "Dementia Education",
    description:
      "Explore learning materials about dementia and Alzheimer's disease.",
    path: "/learn-events/dementia-education",
    category: "Learn & Events",
    keywords: "education learning dementia alzheimer resources",
  },
  {
    title: "Training Resources",
    description:
      "Access training and educational resources.",
    path: "/learn-events/training-resources",
    category: "Learn & Events",
    keywords: "training resources learning education",
  },
  {
    title: "Webinars",
    description:
      "Explore dementia-related webinars and learning sessions.",
    path: "/learn-events/webinars",
    category: "Learn & Events",
    keywords: "webinar online event learning education",
  },
  {
    title: "Certified Trainer Events",
    description:
      "Find upcoming Certified Trainer-led events and workshops.",
    path: "/learn-events/events",
    category: "Learn & Events",
    keywords: "event workshop trainer certified city language",
  },

  {
    title: "About the Project",
    description:
      "Learn more about Rotary Hope Care and the Alzheimer's Care project.",
    path: "/about",
    category: "About Us",
    keywords: "about rotary hope care project",
  },
  {
    title: "Contact Us",
    description:
      "Contact the project team if you need help finding information.",
    path: "/about/contact",
    category: "About Us",
    keywords: "contact email whatsapp help team",
  },
  {
    title: "Where to Find Us",
    description:
      "Find project locations and related information.",
    path: "/about/locations",
    category: "About Us",
    keywords: "location address find us where",
  },
];

function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const searchQuery = query.trim().toLowerCase();

    if (!searchQuery) {
      return [];
    }

    return searchItems.filter((item) => {
      const searchableText = `
        ${item.title}
        ${item.description}
        ${item.category}
        ${item.keywords}
      `.toLowerCase();

      return searchableText.includes(searchQuery);
    });
  }, [query]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Search website"
    >
      <button
        className="search-backdrop"
        onClick={onClose}
        aria-label="Close search"
      />

      <div className="search-panel">
        <div className="search-panel-top">
          <div>
            <span className="search-label">Search</span>
            <h2>What are you looking for?</h2>
          </div>

          <button
            className="search-close"
            onClick={onClose}
            aria-label="Close search"
          >
            ×
          </button>
        </div>

        <div className="search-input-wrapper">
          <span className="search-icon">⌕</span>

          <input
            ref={inputRef}
            type="search"
            placeholder="Try “caregiver”, “Alzheimer's” or “events”"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search website"
          />

          {query && (
            <button
              className="search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>

        {!query && (
          <div className="search-suggestions">
            <p>Popular searches</p>

            <div className="suggestion-buttons">
              <button onClick={() => setQuery("dementia")}>
                Dementia
              </button>

              <button onClick={() => setQuery("caregiver")}>
                Caregiver Support
              </button>

              <button onClick={() => setQuery("healthcare")}>
                Healthcare
              </button>

              <button onClick={() => setQuery("events")}>
                Events
              </button>
            </div>
          </div>
        )}

        {query && (
          <div className="search-results">
            <div className="search-results-heading">
              <span>
                {results.length}{" "}
                {results.length === 1 ? "result" : "results"}
              </span>
            </div>

            {results.length > 0 ? (
              <div className="search-results-list">
                {results.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="search-result"
                    onClick={onClose}
                  >
                    <div>
                      <span className="search-result-category">
                        {item.category}
                      </span>

                      <h3>{item.title}</h3>

                      <p>{item.description}</p>
                    </div>

                    <span className="search-result-arrow">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="search-empty">
                <h3>No results found</h3>

                <p>
                  Try searching with a different word, such as
                  “dementia”, “caregiver”, “doctor” or “events”.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchOverlay;