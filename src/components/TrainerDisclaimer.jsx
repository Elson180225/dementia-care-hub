import { TRAINER_DISCLAIMER } from "../../shared/trainer-disclaimer";
import "./TrainerDisclaimer.css";

// RCBC's approved English wording, shown in every language until a translation is approved.
export default function TrainerDisclaimer() {
  return (
    <aside className="trainer-disclaimer" lang="en" aria-labelledby="trainer-disclaimer-title">
      <h3 id="trainer-disclaimer-title">{TRAINER_DISCLAIMER.title}</h3>
      {TRAINER_DISCLAIMER.paragraphs.map((text) => <p key={text}>{text}</p>)}
    </aside>
  );
}