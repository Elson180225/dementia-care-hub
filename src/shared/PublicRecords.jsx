import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, post } from "./api";
import { Badge, AssetLink } from "./RecordFields";
import "../admin/Admin.css";
export function useRecords(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setData(null);
    setError("");
    api(path)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [path, attempt]);
  return { data, error, retry: () => setAttempt((n) => n + 1) };
}
function State({ data, error, retry }) {
  return error ? (
    <p role="alert" className="ad-error">
      {error} <button onClick={retry}>Retry</button>
    </p>
  ) : data === null ? (
    <p role="status">Loading approved records…</p>
  ) : !data.length ? (
    <p>No approved records are available yet.</p>
  ) : null;
}
const date = (s) =>
  s
    ? new Date(s).toLocaleString("en-MY", {
        timeZone: "Asia/Kuala_Lumpur",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Date to be confirmed";
const titles = {
  "certified-trainers": "Certified Trainers",
  "upcoming-calendar": "Upcoming Calendar",
  "online-education": "Online Education",
  "physical-education": "Physical Education",
  events: "Events",
};
export function LiveEducation({ module }) {
  const trainers = module === "certified-trainers";
  const records = useRecords(
    trainers ? "/public/trainers" : "/public/activities",
  );
  const [search, setSearch] = useState(""),
    [language, setLanguage] = useState("all");
  const rows = (records.data || [])
    .filter(
      (r) =>
        JSON.stringify(r).toLowerCase().includes(search.toLowerCase()) &&
        (language === "all" || r.language_code === language),
    )
    .filter((r) =>
      trainers || module === "upcoming-calendar"
        ? trainers ||
          (r.lifecycle === "published" && new Date(r.starts_at) >= new Date())
        : module === "online-education"
          ? r.mode === "online"
          : module === "physical-education"
            ? r.mode === "physical"
            : ["expo", "dialogue", "forum", "other"].includes(r.type_code),
    );
  return (
    <main className="ad-page">
      <span className="ad-eyebrow">EDUCATION & EVENTS</span>
      <h1>{titles[module]}</h1>
      <p>
        {trainers
          ? "RCBC-approved project trainers and their education contributions."
          : "Explore approved education activities. Registration is handled through the approved external form."}
      </p>
      <div className="ad-actions">
        {Object.entries(titles).map(([key, title]) => (
          <Link key={key} to={"/learn-events/" + key}>
            {title}
          </Link>
        ))}
        <Link to="/learning-resources">Learning Resources</Link>
      </div>
      <div className="ad-toolbar">
        <label>
          Search title / city / trainer
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Delivery language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {["all", "en", "ms", "zh"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>
      <State {...records} />
      <div className="ad-cards">
        {rows.map((r) => (
          <article className="ad-card" key={r.id}>
            {trainers ? (
              <>
                {r.photo_asset_id && (
                  <img
                    className="ad-image"
                    src={"/api/assets/" + r.photo_asset_id}
                    alt={r.name}
                  />
                )}
                <h2>{r.name}</h2>
                <p>
                  {r.city} · {r.language_code}
                </p>
                <p>Certificate: {r.certificate_reference}</p>
                <p>{r.short_profile}</p>
                <p>{r.qualifications}</p>
                <p>{r.experience}</p>
                <Link to={"/trainers/" + r.id}>
                  View profile & activities →
                </Link>
              </>
            ) : (
              <>
                {r.poster_asset_id && (
                  <img
                    className="ad-image"
                    src={"/api/assets/" + r.poster_asset_id}
                    alt="Activity poster"
                  />
                )}
                <Badge>{r.lifecycle}</Badge>
                <h2>{r.title}</h2>
                <p>{date(r.starts_at)}</p>
                <p>
                  {r.mode} · {r.city || r.venue} · {r.language_code}
                </p>
                <p>{r.target_audience}</p>
                <p>{r.description}</p>
                {r.trainers?.map((t) => (
                  <p key={t.trainer_id}>
                    <Link to={"/trainers/" + t.trainer_id}>{t.name}</Link> ·{" "}
                    {t.role}
                  </p>
                ))}
                <Link to={"/activities/" + r.id}>View details →</Link>
              </>
            )}
          </article>
        ))}
      </div>
      {records.data && !rows.length && <p>No records match your filters.</p>}
    </main>
  );
}
export function TrainerPublicProfile() {
  const { id } = useParams(),
    profiles = useRecords("/public/trainers"),
    activities = useRecords("/public/activities");
  const p = profiles.data?.find((p) => p.id === id);
  return (
    <main className="ad-page">
      <State {...profiles} />
      {p ? (
        <>
          <h1>{p.name}</h1>
          <p>
            {p.city} · {p.language_code} · Certificate {p.certificate_reference}
          </p>
          <p>{p.short_profile}</p>
          <p>{p.qualifications}</p>
          <p>{p.experience}</p>
          <h2>Approved activities</h2>
          {activities.data
            ?.filter((a) => a.trainers.some((t) => t.trainer_id === id))
            .map((a) => (
              <p key={a.id}>
                <Link to={"/activities/" + a.id}>{a.title}</Link> ·{" "}
                {date(a.starts_at)}
              </p>
            ))}
        </>
      ) : (
        profiles.data && <p>Approved trainer not found.</p>
      )}
    </main>
  );
}
export function ActivityLanding() {
  const { id } = useParams(),
    record = useRecords("/public/activities/" + id);
  const [locale, setLocale] = useState("en");
  const a = record.data;
  const t = a?.translations?.find((t) => t.locale === locale);
  const closed =
    a &&
    (a.registration_closed ||
      a.lifecycle !== "published" ||
      new Date(a.registration_deadline || a.starts_at) < new Date());
  return (
    <main className="ad-page">
      {record.error ? (
        <p className="ad-error">{record.error}</p>
      ) : !a ? (
        <p>Loading activity…</p>
      ) : (
        <>
          <label>
            Page language
            <select value={locale} onChange={(e) => setLocale(e.target.value)}>
              {["en", "ms", "zh"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          {locale !== "en" && !t && (
            <p>Translation unavailable. Showing the original content.</p>
          )}
          <Badge>{a.lifecycle}</Badge>
          <h1>{t?.title || a.title}</h1>
          <p>
            {date(a.starts_at)}
            {a.ends_at ? " — " + date(a.ends_at) : ""}
          </p>
          <p>
            {a.mode} · {a.city} · {a.venue} · Delivery language:{" "}
            {a.language_code}
          </p>
          <p>Suitable for: {t?.target_audience || a.target_audience}</p>
          <p>{t?.description || a.description}</p>
          {a.poster_asset_id && (
            <img
              className="ad-image"
              src={"/api/assets/" + a.poster_asset_id}
              alt="Activity poster"
            />
          )}
          <p>{a.capacity ? "Capacity: " + a.capacity : ""}</p>
          {closed ? (
            <p>
              Registration closed. This activity page remains available for
              reference.
            </p>
          ) : a.registration_url ? (
            <a href={a.registration_url} target="_blank" rel="noreferrer">
              Register on the external form ↗
            </a>
          ) : (
            <p>Registration details will be provided by the organiser.</p>
          )}
          <h2>Approved activity materials</h2>
          {a.assets.map((f) => (
            <p key={f.id}>
              <AssetLink id={f.id}>
                {f.purpose}: {f.original_filename}
              </AssetLink>
            </p>
          ))}
        </>
      )}
    </main>
  );
}
export function Directory({ kind, title = "Find Help & Support" }) {
  const records = useRecords("/public/organisations"),
    [search, setSearch] = useState(""),
    [city, setCity] = useState("all"),
    [language, setLanguage] = useState("all"),
    [volunteers, setVolunteers] = useState(false);
  const rows = (records.data || []).filter(
    (r) =>
      (!kind ||
        (Array.isArray(kind) ? kind.includes(r.kind) : r.kind === kind)) &&
      JSON.stringify(r).toLowerCase().includes(search.toLowerCase()) &&
      (city === "all" || r.city === city) &&
      (language === "all" || r.language_codes.includes(language)) &&
      (!volunteers || r.accepting_volunteers),
  );
  return (
    <main className="ad-page">
      <span className="ad-eyebrow">SHARED DIRECTORY</span>
      <h1>{title}</h1>
      <p>
        Information and navigation to external organisations. Listing does not
        constitute an RCBC endorsement or guarantee.
      </p>
      <div className="ad-toolbar">
        <label>
          Need / support type / name
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          City
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="all">All cities</option>
            {[...new Set(records.data?.map((r) => r.city))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {["all", "en", "ms", "zh"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <input
          type="checkbox"
          checked={volunteers}
          onChange={(e) => setVolunteers(e.target.checked)}
        />
        Accepting volunteers
      </label>
      <State {...records} />
      <div className="ad-cards">
        {rows.map((r) => (
          <article className="ad-card" key={r.id}>
            <Badge>{r.kind}</Badge>
            <h2>{r.name}</h2>
            <p>
              {r.city}, {r.state} · {r.language_codes.join(", ")}
            </p>
            <p>{r.focus}</p>
            <p>{r.address}</p>{r.registration_number&&<p>Registration no.: {r.registration_number}</p>}
            <p>{r.activity_frequency}</p>
            <p>
              {r.accepting_volunteers
                ? "Accepting volunteers"
                : "Not currently accepting volunteers"}
            </p>
            {r.contact_email && (
              <p>
                <a href={"mailto:" + r.contact_email}>{r.contact_email}</a>
              </p>
            )}
            {r.contact_phone && <p>{r.contact_phone}</p>}
            {r.official_url && (
              <a href={r.official_url} target="_blank" rel="noreferrer">
                Official website ↗
              </a>
            )}
            <p className="ad-small">
              Last reviewed: {date(r.last_reviewed_at)}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
export function LearningResources() {
  const records = useRecords("/public/resources");
  const [locale, setLocale] = useState("en");
  return (
    <main className="ad-page">
      <h1>Learning Resources</h1>
      <label>
        Website language
        <select value={locale} onChange={(e) => setLocale(e.target.value)}>
          {["en", "ms", "zh"].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </label>
      <p>Reviewed recordings, Q&A, handouts and educational materials.</p>
      <State {...records} />
      <div className="ad-cards">
        {records.data?.map((r) => (
          <article className="ad-card" key={r.id}>
            <h2>
              {r.translations?.find((t) => t.locale === locale)?.title ||
                r.title}
            </h2>
            <p>
              {r.resource_type} · {r.language_code}
            </p>
            <p>
              {r.translations?.find((t) => t.locale === locale)?.description ||
                r.description}
            </p>
            {r.external_url && (
              <p>
                <a href={r.external_url} target="_blank" rel="noreferrer">
                  Open resource ↗
                </a>
              </p>
            )}
            {r.asset_id && (
              <p>
                <AssetLink id={r.asset_id}>Download material</AssetLink>
              </p>
            )}
            {r.activity_id && (
              <Link to={"/activities/" + r.activity_id}>
                Original activity →
              </Link>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
export function Subscribe() {
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="ad-page">
      <h1>Get Updated</h1>
      <p>
        Receive email updates about RCBC education and project activities. This
        is a subscription, not an account.
      </p>
      <section className="ad-card">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const f = Object.fromEntries(new FormData(e.currentTarget));
              setMessage(
                (
                  await post("/public/subscribe", {
                    ...f,
                    consent_given: f.consent_given === "on",
                  })
                ).message,
              );
            } catch (err) {
              setError(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {[
            ["name", "Name", "text"],
            ["email", "Email", "email"],
            ["city", "City", "text"],
            ["state", "State", "text"],
          ].map(([name, label, type]) => (
            <label key={name}>
              {label}
              <input name={name} type={type} required />
            </label>
          ))}
          <label>
            Preferred language
            <select name="preferred_language">
              <option value="en">English</option>
              <option value="ms">Bahasa Malaysia</option>
              <option value="zh">Chinese</option>
            </select>
          </label>
          <label>
            <input type="checkbox" name="consent_given" required />I agree to
            receive project updates from RCBC by email.
          </label>
          <p className="ad-small">
            Your name, email, locality and preferred language are stored for
            project outreach. You may stop updates at any time. Demonstration
            privacy notice v1; RCBC must approve the final notice before launch.
          </p>
          <button disabled={busy}>Subscribe</button>
        </form>
      </section>
      <section className="ad-card">
        <h2>Unsubscribe</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            try {
              setMessage(
                (
                  await post("/public/unsubscribe", {
                    email: new FormData(e.currentTarget).get("email"),
                  })
                ).message,
              );
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <label>
            Email
            <input type="email" name="email" required />
          </label>
          <button className="ad-secondary">Stop email updates</button>
        </form>
      </section>
      {message && (
        <p className="ad-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="ad-error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
export function CertificateVerification() {
  const [result, setResult] = useState(null),
    [error, setError] = useState("");
  return (
    <main className="ad-page">
      <h1>Verify a DCS Certificate</h1>
      <p>
        Enter the participant name and certificate number. Verification confirms
        programme completion, not professional licensing or an RCBC service
        endorsement.
      </p>
      <section className="ad-card">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            try {
              setResult(
                await post(
                  "/public/certificates/verify",
                  Object.fromEntries(new FormData(e.currentTarget)),
                ),
              );
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <label>
            Participant name
            <input name="name" required />
          </label>
          <label>
            Certificate number
            <input name="certificate_number" required />
          </label>
          <button>Verify certificate</button>
        </form>
        {result && (
          <p role="status">
            {result.found
              ? `${result.name} · ${result.programme} · ${result.city} · ${result.year} · ${result.status}`
              : "No matching certificate found."}
          </p>
        )}
        {error && (
          <p className="ad-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
export function ContentPage({ section, title = "Project guidance" }) {
  const records = useRecords("/public/content"),
    [locale, setLocale] = useState("en");
  const filtered = (records.data || []).filter((r) => r.section === section);
  const rows = filtered.filter((r) => r.locale === locale);
  return (
    <main className="ad-page">
      <h1>{title}</h1>
      <label>
        Website language
        <select value={locale} onChange={(e) => setLocale(e.target.value)}>
          {["en", "ms", "zh"].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </label>
      <State {...records} />
      {!rows.length && locale !== "en" && (
        <p>Translation unavailable. Showing English content.</p>
      )}
      {(rows.length ? rows : filtered.filter((r) => r.locale === "en")).map(
        (r) => (
          <section className="ad-card" key={r.slug}>
            <h2>{r.title}</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{r.body}</p>
            <p className="ad-small">Reviewed: {date(r.last_reviewed_at)}</p>
          </section>
        ),
      )}
      {section === "caregiver" && (
        <div className="ad-actions">
          <Link to="/certificate-verification">Verify DCS Certificate</Link>
          <Link to="/support-groups">Support Groups & Volunteer</Link>
          <Link to="/learn-events/physical-education">
            Caregiver training activities
          </Link>
        </div>
      )}
    </main>
  );
}
