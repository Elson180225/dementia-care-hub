import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import "./ScrollToTop.css";

const RADIUS = 23;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScrollProgress() {
  const scrollableHeight =
    document.documentElement.scrollHeight -
    window.innerHeight;

  if (scrollableHeight <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (window.scrollY / scrollableHeight) * 100
    )
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  const [progress, setProgress] = useState(0);

  /* =========================================
     SCROLL TO TOP WHEN ROUTE CHANGES
  ========================================= */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    setProgress(0);
  }, [pathname]);

  /* =========================================
     TRACK PAGE SCROLL PROGRESS
  ========================================= */

  useEffect(() => {
    let frameId = null;

    const updateProgress = () => {
      if (frameId !== null) return;

      frameId = window.requestAnimationFrame(() => {
        setProgress(getScrollProgress());

        frameId = null;
      });
    };

    updateProgress();

    window.addEventListener(
      "scroll",
      updateProgress,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "resize",
      updateProgress
    );

    return () => {
      window.removeEventListener(
        "scroll",
        updateProgress
      );

      window.removeEventListener(
        "resize",
        updateProgress
      );

      if (frameId !== null) {
        window.cancelAnimationFrame(
          frameId
        );
      }
    };
  }, []);

  const dashOffset =
    CIRCUMFERENCE -
    (progress / 100) *
      CIRCUMFERENCE;

  const visible =
    progress > 3;

  /* =========================================
     MANUAL BACK TO TOP BUTTON
  ========================================= */

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,

      behavior: window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
        ? "auto"
        : "smooth",
    });
  };

  return (
    <button
      type="button"
      className={`scroll-to-top ${
        visible
          ? "scroll-to-top-visible"
          : ""
      }`}
      onClick={scrollToTop}
      aria-label={`Back to top. Page is ${Math.round(
        progress
      )} percent scrolled.`}
      aria-hidden={!visible}
      tabIndex={
        visible ? 0 : -1
      }
    >
      <svg
        className="scroll-progress-ring"
        viewBox="0 0 52 52"
        aria-hidden="true"
      >
        <circle
          className="scroll-progress-track"
          cx="26"
          cy="26"
          r={RADIUS}
        />

        <circle
          className="scroll-progress-value"
          cx="26"
          cy="26"
          r={RADIUS}
          strokeDasharray={
            CIRCUMFERENCE
          }
          strokeDashoffset={
            dashOffset
          }
        />
      </svg>

      <span
        className="scroll-to-top-arrow"
        aria-hidden="true"
      />
    </button>
  );
}

export default ScrollToTop;