import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import statistics from "../../data/Statistics";

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

  const activeStatistic =
    statistics.find(
      (stat) =>
        stat.id === activeCard
    ) || statistics[0];

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
              Why Does This
              Matter?
            </span>

            <h2>
              Dementia in
              Malaysia
            </h2>
          </div>

          <p>
            Explore official
            dementia and ageing
            statistics for Malaysia
            and Sarawak.
          </p>
        </div>

        {/* TAB NAVIGATION */}

        <div
          className="statistics-tabs"
          role="tablist"
          aria-label="Statistics categories"
        >
          {statistics.map(
            (stat) => (
              <button
                key={stat.id}
                type="button"
                role="tab"
                aria-selected={
                  activeCard ===
                  stat.id
                }
                className={`statistics-tab ${
                  activeCard ===
                  stat.id
                    ? "statistics-tab-active"
                    : ""
                }`}
                onClick={() =>
                  setActiveCard(
                    stat.id
                  )
                }
              >
                <span>
                  {
                    stat.shortLabel
                  }
                </span>

                <strong>
                  {stat.region}
                </strong>
              </button>
            )
          )}
        </div>

        {/* VISUAL CARD */}

        <div
          className="statistics-card"
          key={
            activeStatistic.id
          }
        >
          <div className="statistics-chart-area">
            {activeStatistic.chartType ===
              "donut" && (
              <DonutChart
                value={
                  activeStatistic.value
                }
                label={
                  activeStatistic.chartLabel
                }
                remainderLabel={
                  activeStatistic.chartRemainderLabel
                }
                active={visible}
              />
            )}

            {activeStatistic.chartType ===
              "bar" && (
              <BarChart
                bars={
                  activeStatistic.bars
                }
                active={visible}
              />
            )}
          </div>

          {/* DESCRIPTION */}

          <div className="statistics-content">
            <span className="statistics-region">
              {
                activeStatistic.region
              }
            </span>

            <h3>
              {
                activeStatistic.title
              }
            </h3>

            <p className="statistics-description">
              {
                activeStatistic.description
              }
            </p>

            <div className="statistics-highlight">
              <span>
                Key figure
              </span>

              <strong>
                {
                  activeStatistic.highlight
                }
              </strong>
            </div>

            <div className="statistics-source-grid">
              <div>
                <span>
                  Source
                </span>

                <a
                  href={
                    activeStatistic.sourceUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {
                    activeStatistic.source
                  }
                </a>
              </div>

              <div>
                <span>
                  Data year
                </span>

                <strong>
                  {
                    activeStatistic.dataYear
                  }
                </strong>
              </div>

              <div>
                <span>
                  Last reviewed
                </span>

                <strong>
                  {
                    activeStatistic.reviewed
                  }
                </strong>
              </div>
            </div>

            <div className="statistics-note">
              <strong>
                Important:
              </strong>{" "}
              {
                activeStatistic.note
              }
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="statistics-bottom">
          <p>
            Data shown are based
            on official information
            identified for the
            project. Figures may be
            updated when newer
            official data become
            available.
          </p>

          <Link
            to="/learn-events/dementia-education"
            className="statistics-link"
          >
            What is Dementia?
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Statistics;