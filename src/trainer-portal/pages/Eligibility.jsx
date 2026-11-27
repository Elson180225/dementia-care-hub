import { Link } from "react-router-dom";

// "Check Your Eligibility & Teaching Conditions" from RCBC's Trainer Portal Draft 02
// (sections 2 and 3). One central guide, linked from sign-in, the application form
// and the trainer dashboard. Public, so applicants can read it before applying.
const CLASSIFICATIONS = [
  {
    name: "HCP Independent",
    score: "37–40 / 40",
    scope: "Independently conduct all approved DCS topics within verified competency and professional scope.",
  },
  {
    name: "Non-HCP Independent",
    score: "37–40 / 40",
    scope: "Independently conduct non-medical and non-health-related topics. Pair with an appropriate healthcare professional (HCP) for medical or health topics.",
  },
  {
    name: "Pass",
    score: "30–36 / 40",
    scope: "Deliver in a pair or group. An appropriate HCP is required for open public medical or health courses.",
  },
  {
    name: "Trained – Assessment Unsuccessful",
    score: "0–29 / 40",
    scope: "Approved supervised pair or group participation only; no independent teaching. An HCP is required for open public medical or health courses.",
  },
];

export default function Eligibility() {
  return (
    <section className="tp-card account-eligibility">
      <Link to="/trainer-portal" className="account-home-link">← Back to sign in</Link>
      <h1>Check Your Eligibility &amp; Teaching Conditions</h1>
      <p>
        Please read this before applying for Trainer Portal access. All applications are subject to
        verification and approval by the RCBC Alzheimer&apos;s Care Project team.
      </p>

      <h2>Who can apply</h2>
      <ul>
        <li>RCBC-trained DCS–TTT participants, subject to verification.</li>
        <li>External ADFM DCS–TTT participants, subject to credential verification.</li>
        <li>Applicants with other qualifications, subject to RCBC recognition criteria.</li>
      </ul>
      <p className="tp-note">
        DCS–Family attendance, healthcare professional status alone, or general public membership
        does not establish eligibility for Trainer Portal access.
      </p>

      <h2>Teaching conditions by verified classification</h2>
      <div className="tp-table-wrap">
        <table className="tp-table">
          <caption className="tp-sr">Teaching conditions by assessment classification</caption>
          <thead>
            <tr><th>Classification</th><th>Assessment score</th><th>What you may teach</th></tr>
          </thead>
          <tbody>
            {CLASSIFICATIONS.map((c) => (
              <tr key={c.name}>
                <td><strong>{c.name}</strong></td>
                <td>{c.score}</td>
                <td>{c.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Separate approvals</h2>
      <ul>
        <li>Trainer Portal account approval does not automatically grant independent teaching permission.</li>
        <li>Your public Certified Trainer profile is published only with your consent and RCBC approval.</li>
        <li>Each training activity is reviewed by RCBC before it is listed on the website.</li>
      </ul>

      <div className="tp-actions">
        <Link className="tp-btn" to="/trainer-portal/signup">Apply for Trainer Portal Access</Link>
        <Link className="tp-btn tp-btn-ghost" to="/trainer-portal">Sign in</Link>
      </div>
    </section>
  );
}
