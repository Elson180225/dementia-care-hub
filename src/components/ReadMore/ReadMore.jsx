import { useId, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import "./ReadMore.css";

// Splits after a full stop, question mark or exclamation mark.
// Chinese punctuation has no space after it, so it is matched separately.
const SENTENCE_END = /(?<=[.!?])\s+(?=\S)|(?<=[。！？])(?=\S)/;

function splitFirstSentence(text) {
  if (typeof text !== "string") return [text, ""];
  const parts = text.trim().split(SENTENCE_END);
  if (parts.length < 2) return [text, ""];
  const first = parts[0];
  return [first, text.trim().slice(first.length).trim()];
}

/**
 * Shows the first sentence of a long paragraph with a "Read more" button.
 * The full approved text is unchanged, so RCBC's reviewed wording and
 * translations still apply. Short text is shown in full without a button.
 */
function ReadMore({ text, className = "", minLength = 140, as: Tag = "p" }) {
  const { translateLabel } = useLanguage();
  const [open, setOpen] = useState(false);
  const id = useId();

  const [first, rest] = splitFirstSentence(text);
  if (!rest || String(text).length < minLength) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={`read-more ${className}`.trim()}>
      <span>{first}</span>{" "}
      <span id={id} hidden={!open}>{rest}</span>{" "}
      <button
        type="button"
        className="read-more-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? translateLabel("Show less", "showLess") : translateLabel("Read more", "readMore")}
      </button>
    </Tag>
  );
}

export default ReadMore;
