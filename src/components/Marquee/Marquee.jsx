import "./Marquee.css";

/**
 * A slow scrolling band of words between sections.
 * Decorative only (the same words appear elsewhere), so it is hidden
 * from screen readers. It stops moving when the visitor prefers less motion.
 */
function Marquee({ items = [], tone = "dark" }) {
  const words = items.filter(Boolean);
  if (!words.length) return null;

  // Repeat enough times to fill wide screens, then twice for a seamless loop.
  const row = Array.from({ length: 4 }, () => words).flat();

  return (
    <div className={`marquee marquee-${tone}`} aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <ul className="marquee-row" key={copy}>
            {row.map((word, index) => (
              <li key={`${copy}-${index}`} className={index % 2 ? "marquee-outline" : ""}>
                {word}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export default Marquee;
