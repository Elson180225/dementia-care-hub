import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./PolicyPage.css";

// Privacy Policy and Terms of Use (Global Website Elements V1.0, sections 10.3 and 11).
// The text here is RCBC's agreed working wording. Final legal wording needs RCBC
// approval and legal review before the website collects personal data publicly.
function PolicyPage({ kind }) {
  const { t } = useLanguage();
  const page = t.policies[kind];

  return (
    <main className="policy-page">
      <header className="policy-hero">
        <div className="policy-container">
          <p className="policy-eyebrow">{t.policies.eyebrow}</p>
          <h1>{page.title}</h1>
          <p className="policy-status" role="note">{page.status}</p>
        </div>
      </header>

      <section className="policy-container policy-body">
        {page.sections.map((section) => (
          <article key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </article>
        ))}

        <p className="policy-contact">
          {t.policies.contactLead} <Link to="/about/contact">{t.header.menu.contactUs}</Link>
        </p>
      </section>
    </main>
  );
}

export default PolicyPage;
