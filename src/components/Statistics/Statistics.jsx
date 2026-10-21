import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import statistics from "../../data/Statistics";
import { useLanguage } from "../../i18n/LanguageContext";

import "./Statistics.css";

/* ============================================================
   ANIMATED NUMBER
============================================================ */

function AnimatedNumber({
  value,
  decimals = 1,
  active,
}) {
  const [displayValue, setDisplayValue] =
    useState(0);

  useEffect(() => {
    if (!active) return;

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }

    const duration = 1200;

    const startTime =
      performance.now();

    let frame;

    const animate = (time) => {
      const progress =
        Math.min(
          (time - startTime) /
            duration,
          1
        );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        );

      setDisplayValue(
        value * eased
      );

      if (progress < 1) {
        frame =
          requestAnimationFrame(
            animate
          );
      }
    };

    frame =
      requestAnimationFrame(
        animate
      );

    return () =>
      cancelAnimationFrame(frame);
  }, [value, active]);

  return Number(
    displayValue
  ).toLocaleString("en-MY", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ============================================================
   DONUT CHART
============================================================ */

function DonutChart({
  value,
  label,
  remainderLabel,
  active,
}) {
  const radius = 82;

  const circumference =
    2 * Math.PI * radius;

  const percentage =
    Math.min(
      Math.max(value, 0),
      100
    );

  const offset =
    circumference -
    (percentage / 100) *
      circumference;

  return (
    <div className="donut-chart-wrapper">
      <div className="donut-chart">
        <svg
          viewBox="0 0 220 220"
          role="img"
          aria-label={`${value}% ${label}`}
        >
          {/* background */}

          <circle
            className="donut-background"
            cx="110"
            cy="110"
            r={radius}
          />

          {/* value */}

          <circle
            className={`donut-progress ${
              active
                ? "donut-progress-active"
                : ""
            }`}
            cx="110"
            cy="110"
            r={radius}
            strokeDasharray={
              circumference
            }
            strokeDashoffset={
              active
                ? offset
                : circumference
            }
          />
        </svg>

        <div className="donut-centre">
          <strong>
            <AnimatedNumber
              value={value}
              decimals={1}
              active={active}
            />
            %
          </strong>

          <span>
            {label}
          </span>
        </div>
      </div>

      <div className="donut-legend">
        <div>
          <span className="legend-dot legend-primary" />

          <div>
            <strong>
              {value}%
            </strong>

            <span>
              {label}
            </span>
          </div>
        </div>

        <div>
          <span className="legend-dot legend-secondary" />

          <div>
            <strong>
              {(100 - value).toFixed(
                1
              )}
              %
            </strong>

            <span>
              {remainderLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   BAR CHART
============================================================ */

function BarChart({
  bars,
  active,
}) {
  const [hoveredBar, setHoveredBar] =
    useState(null);

  const maxValue =
    Math.max(
      ...bars.map(
        (bar) => bar.value
      )
    );

  return (
    <div className="bar-chart">
      <div className="bar-scale">
        <span>0%</span>
        <span>10%</span>
        <span>20%</span>
        <span>25%</span>
      </div>

      <div className="bar-chart-grid">
        {bars.map(
          (bar, index) => {
            const width =
              (bar.value /
                25) *
              100;

            return (
              <button
                key={bar.label}
                type="button"
                className={`bar-row ${
                  hoveredBar ===
                  index
                    ? "bar-row-active"
                    : ""
                }`}
                onMouseEnter={() =>
                  setHoveredBar(
                    index
                  )
                }
                onMouseLeave={() =>
                  setHoveredBar(
                    null
                  )
                }
                onFocus={() =>
                  setHoveredBar(
                    index
                  )
                }
                onBlur={() =>
                  setHoveredBar(
                    null
                  )
                }
              >
                <div className="bar-label">
                  <span>
                    {bar.label}
                  </span>

                  <strong>
                    <AnimatedNumber
                      value={
                        bar.value
                      }
                      decimals={1}
                      active={
                        active
                      }
                    />
                    %
                  </strong>
                </div>

                <div className="bar-track">
                  <div
                    className={`bar-fill ${
                      active
                        ? "bar-fill-visible"
                        : ""
                    }`}
                    style={{
                      "--bar-width": `${width}%`,
                      transitionDelay: `${index * 120}ms`,
                    }}
                  />

                  {hoveredBar ===
                    index && (
                    <div
                      className="bar-tooltip"
                      style={{
                        left: `${Math.min(
                          width,
                          88
                        )}%`,
                      }}
                    >
                      {bar.value}%
                      aged 60+
                    </div>
                  )}
                </div>
              </button>
            );
          }
        )}
      </div>

      <p className="bar-chart-caption">
        Share of district
        population aged 60 years
        and above.
      </p>
    </div>
  );
}

/* ============================================================
   STATISTICS
============================================================ */

function Statistics() {
  const sectionRef =
    useRef(null);

  const [
    visible,
    setVisible,
  ] = useState(false);

  const [
    activeCard,
    setActiveCard,
  ] = useState("malaysia");

  useEffect(() => {
    const section =
      sectionRef.current;

    if (!section) return;

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting
          ) {
            setVisible(true);

            observer.disconnect();
          }
        },
        {
          threshold: 0.2,
        }
      );

    observer.observe(section);

    return () =>
      observer.disconnect();
  }, []);

  const { t } = useLanguage();
  const statText = t.statistics || {};

  const activeStatistic =
    statistics.find(
      (stat) =>
        stat.id === activeCard
    ) || statistics[0];

  const regionLabel = activeStatistic.id === "malaysia"
    ? (statText.tabMalaysia || activeStatistic.region)
    : activeStatistic.id === "sarawak"
    ? (statText.tabSarawak || activeStatistic.region)
    : (statText.tabDistrict || activeStatistic.region);

  const titleText = activeStatistic.id === "malaysia"
    ? (statText.malaysiaTitle || activeStatistic.title)
    : activeStatistic.id === "sarawak"
    ? (statText.sarawakTitle || activeStatistic.title)
    : (statText.districtsTitle || activeStatistic.title);

  const descText = activeStatistic.id === "malaysia"
    ? (statText.malaysiaDesc || activeStatistic.description)
    : activeStatistic.id === "sarawak"
    ? (statText.sarawakDesc || activeStatistic.description)
    : (statText.districtsDesc || activeStatistic.description);

  const highlightText = activeStatistic.id === "malaysia"
    ? (statText.malaysiaHighlight || activeStatistic.highlight)
    : activeStatistic.id === "sarawak"
    ? (statText.sarawakHighlight || activeStatistic.highlight)
    : activeStatistic.highlight;

  const noteText = activeStatistic.id === "malaysia"
    ? (statText.malaysiaNote || activeStatistic.note)
    : activeStatistic.id === "sarawak"
    ? (statText.sarawakNote || activeStatistic.note)
    : (statText.districtsNote || activeStatistic.note);

  const chartLabel = activeStatistic.id === "malaysia"
    ? (statText.malaysiaChartLabel || activeStatistic.chartLabel)
    : (statText.sarawakChartLabel || activeStatistic.chartLabel);

  const chartRemainderLabel = activeStatistic.id === "malaysia"
    ? (statText.malaysiaChartRemainder || activeStatistic.chartRemainderLabel)
    : (statText.sarawakChartRemainder || activeStatistic.chartRemainderLabel);

  return (
    <section
      ref={sectionRef}
      id="dementia-statistics"
      className={`statistics-section ${
        visible
          ? "statistics-visible"
          : ""
      }`}
    >
      <div className="section-container">

        {/* HEADER */}

        <div className="statistics-header">
          <div>
            <span className="statistics-kicker">
              {statText.kicker || "Why Does This Matter?"}
            </span>

            <h2>
              {statText.title || "Dementia in Malaysia"}
            </h2>
          </div>

          <p>
            {statText.subtitle || "Explore official dementia and ageing statistics for Malaysia and Sarawak."}
          </p>
        </div>

        {/* TAB NAVIGATION */}

        <div
          className="statistics-tabs"
          role="tablist"
          aria-label="Statistics categories"
        >
          {statistics.map((stat) => {
            const label = stat.id === "malaysia" 
              ? { short: statText.tabNational || stat.shortLabel, region: statText.tabMalaysia || stat.region }
              : stat.id === "sarawak"
              ? { short: statText.tabState || stat.shortLabel, region: statText.tabSarawak || stat.region }
              : { short: statText.tabComparison || stat.shortLabel, region: statText.tabDistrict || stat.region };

            return (
              <button
                key={stat.id}
                type="button"
                role="tab"
                aria-selected={activeCard === stat.id}
                className={`statistics-tab ${
                  activeCard === stat.id ? "statistics-tab-active" : ""
                }`}
                onClick={() => setActiveCard(stat.id)}
              >
                <span>{label.short}</span>
                <strong>{label.region}</strong>
              </button>
            );
          })}
        </div>

        {/* VISUAL CARD */}

        <div
          className="statistics-card"
          key={activeStatistic.id}
        >
          <div className="statistics-chart-area">
            {activeStatistic.chartType === "donut" && (
              <DonutChart
                value={activeStatistic.value}
                label={chartLabel}
                remainderLabel={chartRemainderLabel}
                active={visible}
              />
            )}

            {activeStatistic.chartType === "bar" && (
              <BarChart
                bars={activeStatistic.bars}
                active={visible}
              />
            )}
          </div>

          {/* DESCRIPTION */}

          <div className="statistics-content">
            <span className="statistics-region">
              {regionLabel}
            </span>

            <h3>
              {titleText}
            </h3>

            <p className="statistics-description">
              {descText}
            </p>

            <div className="statistics-highlight">
              <span>
                {statText.keyFigure || "Key figure"}
              </span>

              <strong>
                {highlightText}
              </strong>
            </div>

            <div className="statistics-source-grid">
              <div>
                <span>
                  {statText.source || "Source"}
                </span>

                <a
                  href={activeStatistic.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {activeStatistic.source}
                </a>
              </div>

              <div>
                <span>
                  {statText.dataYear || "Data year"}
                </span>

                <strong>
                  {activeStatistic.dataYear}
                </strong>
              </div>

              <div>
                <span>
                  {statText.lastReviewed || "Last reviewed"}
                </span>

                <strong>
                  {activeStatistic.reviewed}
                </strong>
              </div>
            </div>

            <div className="statistics-note">
              <strong>
                {statText.important || "Important:"}
              </strong>{" "}
              {noteText}
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="statistics-bottom">
          <p>
            {statText.footerNote || "Data shown are based on official information identified for the project. Figures may be updated when newer official data become available."}
          </p>

          <Link
            to="/learn-events/dementia-education"
            className="statistics-link"
          >
            {statText.learnMore || "What is Dementia?"}
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Statistics;