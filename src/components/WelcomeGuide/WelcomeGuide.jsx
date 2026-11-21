import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { OPEN_WELCOME_GUIDE } from "./openWelcomeGuide";
import "./WelcomeGuide.css";

// Answers are saved in this browser only, never sent to the server.
const STORAGE_KEY = "dch_welcome_guide";

const STEPS = ["language", "who", "concern", "city"];
const WHO = ["self", "family", "carer", "learning"];
const CONCERN = ["changes", "diagnosed", "service", "learn"];
const CITIES = ["Bintulu", "Miri", "Sibu", "Kuching", "Other"];

// Where each answer leads, and which checklist items to show.
function buildResult({ who, concern }) {
  const forSomeoneElse = who === "family" || who === "carer";
  switch (concern) {
    case "changes":
      return {
        to: "/find-help/assessment-healthcare",
        steps: [
          { key: "notes" },
          { key: "signs", to: "/understand-dementia#early-signs" },
          ...(forSomeoneElse ? [{ key: "talk" }] : []),
          { key: "doctor", to: "/find-help/assessment-healthcare" },
          { key: "bring" },
        ],
      };
    case "diagnosed":
      return {
        to: who === "self" ? "/find-help/support-services" : "/caregiver-support",
        steps: [
          { key: "ask" },
          { key: "group", to: "/caregiver-support/support-groups" },
          { key: "money", to: "/find-help/government-financial" },
          { key: "plan", to: "/find-help#advance-planning" },
          ...(forSomeoneElse ? [{ key: "selfCare", to: "/caregiver-support" }] : []),
        ],
      };
    case "service":
      return {
        to: "/find-help/resource-finder",
        steps: [{ key: "need" }, { key: "place" }, { key: "call" }],
      };
    default:
      return {
        to: who === "learning" ? "/understand-dementia" : "/learn-events",
        steps: [
          { key: "basics", to: "/understand-dementia" },
          { key: "risk", to: "/understand-dementia#risk-reduction" },
          { key: "webinar", to: "/learn-events" },
          { key: "updates", to: "/get-updated" },
        ],
      };
  }
}

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

function save(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private browsing can block storage; the guide still works for this visit.
  }
}

function fill(text, values) {
  return Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, value),
    text || ""
  );
}

export default function WelcomeGuide() {
  const { t, language, setLanguage, languages } = useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const g = t.welcomeGuide;

  // Show automatically on the home page, only on the first visit.
  const [open, setOpen] = useState(() => pathname === "/" && !readSaved());
  const [lastPath, setLastPath] = useState(pathname);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const dialogRef = useRef(null);

  // A visitor who first lands on another page sees the guide when they reach the home page.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (pathname === "/" && !readSaved()) setOpen(true);
  }

  // Allow other buttons to open the guide again.
  useEffect(() => {
    const reopen = () => {
      setAnswers(readSaved()?.answers || {});
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_WELCOME_GUIDE, reopen);
    return () => window.removeEventListener(OPEN_WELCOME_GUIDE, reopen);
  }, []);

  // Stop the page behind from scrolling, and move focus into the dialog.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (open) dialogRef.current?.querySelector("button.wg-option, .wg-result h2")?.focus();
  }, [open, step]);

  if (!open || !g) return null;

  const finished = step >= STEPS.length;
  const city = answers.city && answers.city !== "Other" ? g.city[answers.city] : g.anywhere;
  const result = finished ? buildResult(answers) : null;
  const copy = finished ? g.results[answers.concern] : null;

  function close(completed) {
    save({ completed, answers });
    setOpen(false);
  }

  function choose(name, value) {
    if (name === "language") setLanguage(value);
    setAnswers((current) => ({ ...current, [name]: value }));
    setStep((current) => current + 1);
  }

  function goToResult() {
    close(true);
    navigate(result.to);
  }

  // Keep keyboard focus inside the dialog; Esc works like "Skip".
  function onKeyDown(event) {
    if (event.key === "Escape") {
      close(false);
      return;
    }
    if (event.key !== "Tab") return;
    const items = dialogRef.current.querySelectorAll("button, a[href]");
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const question = STEPS[step];
  const options = {
    language: languages.map((l) => [l.code, l.nativeLabel]),
    who: WHO.map((id) => [id, g.who[id]]),
    concern: CONCERN.map((id) => [id, g.concern[id]]),
    city: CITIES.map((id) => [id, g.city[id]]),
  }[question];

  return (
    <div className="wg-backdrop">
      <div
        className="wg-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wg-title"
        ref={dialogRef}
        onKeyDown={onKeyDown}
      >
        <div className="wg-top">
          {step > 0 && (
            <button type="button" className="wg-link" onClick={() => setStep(step - 1)}>
              ← {g.back}
            </button>
          )}
          <button type="button" className="wg-link wg-skip" onClick={() => close(finished)}>
            {finished ? g.close : g.skip}
          </button>
        </div>

        {!finished ? (
          <div className="wg-question" key={question}>
            {step === 0 && (
              <>
                <h2 id="wg-title" className="wg-title">{g.title}</h2>
                <p className="wg-intro">{g.intro}</p>
              </>
            )}
            <div className="wg-progress" aria-hidden="true">
              {STEPS.map((name, i) => (
                <span key={name} className={i <= step ? "is-done" : ""} />
              ))}
            </div>
            <p className="wg-count">{fill(g.progress, { current: step + 1, total: STEPS.length })}</p>
            <h3 id={step === 0 ? undefined : "wg-title"} className="wg-ask">
              {g.questions[question]}
            </h3>
            <div className="wg-options">
              {options.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className="wg-option"
                  aria-pressed={(question === "language" ? language : answers[question]) === value}
                  onClick={() => choose(question, value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="wg-privacy">{g.privacy}</p>
          </div>
        ) : (
          <div className="wg-result wg-print">
            <span className="wg-kicker">{g.resultKicker}</span>
            <h2 id="wg-title" tabIndex="-1">{copy.title}</h2>
            <p>{copy.text}</p>

            <h3>{g.checklistTitle}</h3>
            <ol className="wg-checklist">
              {result.steps.map(({ key, to }) => {
                const text = fill(copy.steps[key], { city });
                return (
                  <li key={key}>
                    {to ? (
                      <Link to={to} onClick={() => close(true)}>{text}</Link>
                    ) : (
                      text
                    )}
                  </li>
                );
              })}
            </ol>
            <p className="wg-disclaimer">{g.disclaimer}</p>

            <div className="wg-actions">
              <button type="button" className="wg-primary" onClick={goToResult}>
                {copy.button} →
              </button>
              <button type="button" className="wg-secondary" onClick={() => window.print()}>
                {g.print}
              </button>
              <button type="button" className="wg-link" onClick={() => setStep(0)}>
                {g.startAgain}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}