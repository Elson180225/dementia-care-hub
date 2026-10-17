import rotaryLogo from "../assets/rotary-logo.jpeg";
import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api, post, put } from "../shared/api";
import { modules } from "../../shared/records";
import {
  Fields,
  valuesFor,
  payloadFor,
  Badge,
  Upload,
  AssetLink,
} from "../shared/RecordFields";
import ActivityEditor from "../shared/ActivityEditor";
import CompletionEditor from "../shared/CompletionEditor";
import "./Admin.css";
const sections = [
  ["overview", "Overview"],
  ["requests", "Trainer access"],
  ["profiles", "Trainer profiles"],
  ["activities", "Activities & calendar"],
  ["completion", "Completion verification"],
  ["organisations", "Directory"],
  ["resources", "Learning resources"],
  ["content", "Content & FAQs"],
  ["users", "Users & access"],
  ["subscribers", "Subscribers"],
  ["certificates", "DCS certificates"],
  ["assets", "Files & permissions"],
  ["enquiries", "Enquiries"],
  ["hours", "Verified contribution"],
  ["audit", "Audit history"],
];
const formatDate = (s) =>
  s
    ? new Date(s).toLocaleString("en-MY", {
        timeZone: "Asia/Kuala_Lumpur",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
export function Detail({ record, data }) {
  const names = new Map([
    ...(data?.users || []).map((r) => [r.id, r.display_name]),
    ...(data?.profiles || []).map((r) => [r.id, r.name]),
    ...(data?.organisations || []).map((r) => [r.id, r.name]),
    ...(data?.activities || []).map((r) => [r.id, r.title]),
    ...(data?.assets || []).map((r) => [r.id, r.original_filename]),
  ]);
  const hidden = [
    "id",
    "password_hash",
    "requested_password_hash",
    "fingerprint",
    "transaction_id",
    "timezone",
  ];
  return (
    <dl className="ad-details">
      {Object.entries(record)
        .filter(([k, v]) => v !== null && !hidden.includes(k))
        .map(([k, v]) => (
          <div key={k}>
            <dt>{k.replace(/_id$/, "").replaceAll("_", " ")}</dt>
            <dd>
              {names.has(v)
                ? names.get(v)
                : typeof v === "object"
                  ? JSON.stringify(v)
                  : /(_at|_on|starts_at|ends_at)$/.test(k) &&
                      !Number.isNaN(Date.parse(v))
                    ? formatDate(v)
                    : typeof v === "boolean"
                      ? v
                        ? "Yes"
                        : "No"
                      : String(v)}
            </dd>
          </div>
        ))}
    </dl>
  );
}
function RecordEditor({ module, record = {}, data, onSaved, onCancel }) {
  const { fields } = modules[module];
  const [values, setValues] = useState(() => valuesFor(fields, record)),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [translations, setTranslations] = useState(
    data.resourceTranslations?.filter((t) => t.resource_id === record.id) || [],
  );
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = payloadFor(fields, values);
      if (module === "resources")
        body.translations = translations.map(
          ({ locale, title, description }) => ({ locale, title, description }),
        );
      await (record.id
        ? put("/admin/" + module + "/" + record.id, body)
        : post("/admin/" + module, body));
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save}>
      <Fields
        fields={fields.filter((f) => f.key !== "asset_id")}
        references={{
          activity_id: data.activities.map((a) => ({
            value: a.id,
            label: a.title,
          })),
          prerequisite_certificate_id: data.certificates
            .filter((c) => c.id !== record.id && c.programme === "dcs_family")
            .map((c) => ({
              value: c.id,
              label: c.certificate_number + " ? " + c.participant_name,
            })),
        }}
        values={values}
        onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))}
      />
      {module === "resources" && values.asset_id && (
        <p>
          <AssetLink id={values.asset_id}>Attached resource file</AssetLink>
        </p>
      )}
      {module === "resources" && (
        <Upload
          onUploaded={(f) => setValues((s) => ({ ...s, asset_id: f.id }))}
        />
      )}
      {module === "resources" && (
        <>
          <h3>Translated resource text</h3>
          {translations.map((t, i) => (
            <div className="ad-card" key={i}>
              <label>
                Language
                <select
                  value={t.locale}
                  onChange={(e) =>
                    setTranslations((all) =>
                      all.map((r, n) =>
                        n === i ? { ...r, locale: e.target.value } : r,
                      ),
                    )
                  }
                >
                  {["en", "ms", "zh"].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </label>
              {["title", "description"].map((k) => (
                <label key={k}>
                  {k}
                  <input
                    value={t[k] || ""}
                    onChange={(e) =>
                      setTranslations((all) =>
                        all.map((r, n) =>
                          n === i ? { ...r, [k]: e.target.value } : r,
                        ),
                      )
                    }
                  />
                </label>
              ))}
              <button
                type="button"
                className="ad-secondary"
                onClick={() =>
                  setTranslations((all) => all.filter((_, n) => n !== i))
                }
              >
                Remove translation
              </button>
            </div>
          ))}
          <button
            type="button"
            className="ad-secondary"
            onClick={() =>
              setTranslations((all) => [
                ...all,
                { locale: "ms", title: "", description: "" },
              ])
            }
          >
            + Add translation
          </button>
        </>
      )}
      <p className="ad-small">
        Edits to public content return it to draft for review.
      </p>
      {error && (
        <p role="alert" className="ad-error">
          {error}
        </p>
      )}
      <div className="ad-actions">
        <button disabled={busy}>Save record</button>
        <button className="ad-secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
function UserForm({ onSaved, onCancel }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const d = Object.fromEntries(new FormData(e.currentTarget));
          if (!d.certificate_reference) delete d.certificate_reference;
          await post("/admin/users", d);
          await onSaved();
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3>Create authorised account</h3>
      <p>
        RCBC must verify identity and certification before creating trainer
        access.
      </p>
      {[
        ["display_name", "Full name", "text"],
        ["email", "Email", "email"],
        ["password", "Initial password (12+ characters)", "password"],
        [
          "certificate_reference",
          "Certificate reference (required for Trainer)",
          "text",
        ],
      ].map(([name, label, type]) => (
        <label key={name}>
          {label}
          <input
            name={name}
            type={type}
            required={name !== "certificate_reference"}
            minLength={name === "password" ? 12 : undefined}
            autoComplete={name === "password" ? "new-password" : undefined}
          />
        </label>
      ))}
      <label>
        Account type
        <select name="role">
          <option value="certified_trainer">Certified Trainer</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      {error && (
        <p role="alert" className="ad-error">
          {error}
        </p>
      )}
      <div className="ad-actions">
        <button disabled={busy}>Create account</button>
        <button type="button" className="ad-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
export default function AdminDashboard() {
  const auth = useAuth(),
    [data, setData] = useState(null),
    [section, setSection] = useState("overview"),
    [selected, setSelected] = useState(null),
    [editing, setEditing] = useState(false),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [comment, setComment] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const d = await api("/admin/workspace");
    setData(d);
    return d;
  }, []);
  useEffect(() => {
    if (auth.user?.role === "admin") load().catch((e) => setError(e.message));
  }, [auth.user, load]);
  if (auth.loading) return <main className="ad-page">Checking session…</main>;
  if (!auth.user) return <Navigate to="/admin/login" replace />;
  if (auth.user.role !== "admin")
    return (
      <main className="ad-page">
        <h1>Admin access required</h1>
        <Link to="/trainer-portal">Open Trainer Portal</Link>
      </main>
    );
  function navigate(s) {
    setSection(s);
    setSelected(null);
    setEditing(false);
    setSearch("");
    setStatus("all");
    setComment("");
    setError("");
    setMessage("");
  }
  async function run(path, body) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await post(path, body);
      const d = await load();
      if (selected) {
        const source = section === "completion" ? "activities" : section;
        setSelected(d[source]?.find((r) => r.id === selected.id) || null);
      }
      setMessage("Changes saved.");
      setComment("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const saved = async () => {
    await load();
    setEditing(false);
    setSelected(null);
    setMessage("Record saved.");
  };
  const rows = data
    ? section === "completion"
      ? data.activities.filter(
          (a) =>
            a.completion_status === "submitted" ||
            a.completion_status === "returned",
        )
      : section === "hours"
        ? data.annual
        : data[section] || []
    : [];
  const filtered = rows.filter(
    (r) =>
      (status === "all" ||
        r.status === status ||
        r.completion_status === status ||
        r.lifecycle === status) &&
      JSON.stringify(r).toLowerCase().includes(search.toLowerCase()),
  );
  const pending = data
    ? {
        requests: data.requests.filter((r) => r.status === "submitted").length,
        profiles: data.profiles.filter((r) => r.status === "submitted").length,
        activities: data.activities.filter((r) => r.status === "submitted")
          .length,
        completion: data.activities.filter(
          (r) => r.completion_status === "submitted",
        ).length,
      }
    : {};
  const title = sections.find(([id]) => id === section)?.[1];
  const actions = (list, path, extra = {}) => (
    <div className="ad-actions">
      {list.map(([action, label]) => (
        <button
          key={action}
          disabled={busy}
          className={
            action.includes("return") || action === "cancel"
              ? "ad-secondary"
              : ""
          }
          onClick={() => run(path, { action, comment, ...extra })}
        >
          {label}
        </button>
      ))}
    </div>
  );
  const s = selected;
  return (
    <main className="ad-shell">
      <aside className="ad-sidebar">
        <Link to="/" className="ad-brand">
          <img
            className="ad-brand-logo"
            src={rotaryLogo}
            alt="Rotary International"
          />
          <span>
            RCBC HopeCare<small>ADMINISTRATION</small>
          </span>
        </Link>
        <p className="ad-nav-label">PROJECT WORKSPACE</p>
        <nav aria-label="Admin Dashboard">
          {sections.map(([id, label]) => (
            <button
              key={id}
              className={section === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <span>{label}</span>
              {pending[id] > 0 && <b>{pending[id]}</b>}
            </button>
          ))}
        </nav>
        <div className="ad-sidebar-footer">
          One record. Shared purpose.
          <br />
          <Link to="/learn-events/upcoming-calendar">
            View public website ↗
          </Link>
        </div>
      </aside>
      <div className="ad-main">
        <header className="ad-topbar">
          <span>RCBC / Administration / {title}</span>
          <div>
            <span>{auth.user.name}</span>
            <button
              className="ad-secondary"
              onClick={async () => {
                try {
                  await auth.logout();
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Log out
            </button>
          </div>
        </header>
        <div className="ad-body">
          <div className="ad-heading">
            <div>
              <span className="ad-eyebrow">DEMENTIA CARE CONNECT</span>
              <h1>{title}</h1>
              <p>
                {section === "overview"
                  ? "A clear view of what needs your attention."
                  : "Review, maintain and publish trusted project records."}
              </p>
            </div>
            <button
              className="ad-secondary"
              onClick={() => load().catch((e) => setError(e.message))}
            >
              ↻ Refresh
            </button>
          </div>
          {error && (
            <p className="ad-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="ad-success" role="status">
              {message}
            </p>
          )}
          {!data && !error && <p role="status">Loading project records…</p>}
          {data && section === "overview" && (
            <>
              <div className="ad-welcome">
                <div>
                  <span className="ad-eyebrow">REVIEW · VERIFY · PUBLISH</span>
                  <h2>Keep the project moving.</h2>
                  <p>
                    Trainer input and RCBC review work together to keep every
                    public record accurate.
                  </p>
                </div>
                <span className="ad-welcome-symbol">✦</span>
              </div>
              <div className="ad-metrics">
                {[
                  ["requests", "Access requests"],
                  ["profiles", "Profile updates"],
                  ["activities", "Activity submissions"],
                  ["completion", "Completion records"],
                ].map(([id, label]) => (
                  <button key={id} onClick={() => navigate(id)}>
                    <span>{label}</span>
                    <strong>{pending[id]}</strong>
                    <small>Review queue →</small>
                  </button>
                ))}
              </div>
              <div className="ad-overview-grid">
                <section className="ad-card">
                  <h2>Needs attention</h2>
                  {Object.entries(pending).map(([id, n]) => (
                    <button
                      className="ad-queue"
                      key={id}
                      onClick={() => navigate(id)}
                    >
                      <span>{sections.find((s) => s[0] === id)[1]}</span>
                      <Badge>{n + " pending"}</Badge>
                      <span>→</span>
                    </button>
                  ))}
                  <button
                    className="ad-queue"
                    onClick={() => navigate("organisations")}
                  >
                    <span>Directory records due for review</span>
                    <b>
                      {
                        data.organisations.filter(
                          (r) =>
                            r.next_review_on &&
                            new Date(r.next_review_on) <= new Date(),
                        ).length
                      }
                    </b>
                    <span>→</span>
                  </button>
                  <button
                    className="ad-queue"
                    onClick={() => navigate("enquiries")}
                  >
                    <span>Enquiries awaiting follow-up</span>
                    <b>
                      {
                        data.enquiries.filter((r) => r.status !== "resolved")
                          .length
                      }
                    </b>
                    <span>→</span>
                  </button>
                </section>
                <section className="ad-card">
                  <h2>Verified project contribution</h2>
                  <p>Derived from verified completed activities.</p>
                  {data.project.map((r) => (
                    <div className="ad-summary" key={r.year}>
                      <strong>{r.year}</strong>
                      <span>{r.activities_conducted} activities</span>
                      <span>{r.activity_hours} activity hours</span>
                      <span>
                        {r.participant_attendances} participant attendances
                      </span>
                    </div>
                  ))}
                  <Link to="/learn-events/certified-trainers">
                    View Certified Trainers ↗
                  </Link>
                </section>
              </div>
            </>
          )}
          {data && section !== "overview" && (
            <>
              {section === "subscribers" && (
                <p>
                  <a href="/api/admin/subscribers/export">
                    Export active consented subscribers (CSV)
                  </a>
                </p>
              )}
              <div className="ad-toolbar">
                <label>
                  Search records
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, city, title…"
                  />
                </label>
                <label>
                  Status
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {[
                      "all",
                      "draft",
                      "submitted",
                      "approved",
                      "returned",
                      "published",
                      "completed",
                      "verified",
                      "archived",
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                {(modules[section] ||
                  ["activities", "users"].includes(section)) && (
                  <button
                    onClick={() => {
                      setSelected({});
                      setEditing(true);
                      setError("");
                    }}
                  >
                    + {section === "users" ? "Create account" : "New record"}
                  </button>
                )}
              </div>
              {section === "hours" ? (
                <div className="ad-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Trainer</th>
                        <th>Year</th>
                        <th>Activities</th>
                        <th>Verified hours</th>
                        <th>Participant reach</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.trainer_id + r.year}>
                          <td>
                            {
                              data.profiles.find((p) => p.id === r.trainer_id)
                                ?.name
                            }
                          </td>
                          <td>{r.year}</td>
                          <td>{r.activities_conducted}</td>
                          <td>{r.verified_hours}</td>
                          <td>{r.participants_reached}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="ad-small">
                    Each assigned trainer receives the activity hours. Project
                    participant totals count each activity once.
                  </p>
                </div>
              ) : (
                <div className="ad-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          {section === "audit" ? "Record / action" : "Record"}
                        </th>
                        <th>
                          {section === "subscribers"
                            ? "Consent / location"
                            : "Status / category"}
                        </th>
                        <th>Updated / created</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>
                              {r.title ||
                                r.name ||
                                r.display_name ||
                                r.original_filename ||
                                r.participant_name ||
                                r.entity_table}
                            </strong>
                            <small>
                              {r.email ||
                                r.city ||
                                r.certificate_number ||
                                r.entity_id ||
                                r.description?.slice(0, 90)}
                            </small>
                          </td>
                          <td>
                            <Badge>
                              {r.completion_status && section === "completion"
                                ? r.completion_status
                                : r.status ||
                                  r.verification_status ||
                                  (r.active === undefined
                                    ? r.role ||
                                      r.kind ||
                                      r.action ||
                                      (r.unsubscribed_at
                                        ? "unsubscribed"
                                        : r.consent_at
                                          ? "subscribed"
                                          : r.publication_approved
                                            ? "public approved"
                                            : "private")
                                    : r.active
                                      ? "active"
                                      : "inactive")}
                            </Badge>
                            {r.lifecycle && <small>{r.lifecycle}</small>}
                          </td>
                          <td>
                            {formatDate(
                              r.updated_at ||
                                r.changed_at ||
                                r.consent_at ||
                                r.created_at,
                            )}
                          </td>
                          <td>
                            <button
                              className="ad-secondary"
                              onClick={() => {
                                setSelected(r);
                                setEditing(false);
                                setComment("");
                                setError("");
                              }}
                            >
                              View / manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filtered.length && (
                    <div className="ad-empty">No records match this view.</div>
                  )}
                </div>
              )}
            </>
          )}
          {s && (
            <section className="ad-editor">
              <div className="ad-heading">
                <h2>
                  {editing
                    ? s.id
                      ? "Edit record"
                      : "Create record"
                    : "Record details"}
                </h2>
                <button
                  className="ad-secondary"
                  onClick={() => {
                    setSelected(null);
                    setEditing(false);
                  }}
                >
                  Close
                </button>
              </div>
              {editing ? (
                section === "activities" ? (
                  <ActivityEditor
                    key={s.id || "new"}
                    record={s}
                    admin
                    organisations={data.organisations}
                    profiles={data.profiles}
                    assignments={data.assignments}
                    translations={data.translations}
                    onSaved={saved}
                    onCancel={() => setEditing(false)}
                  />
                ) : section === "completion" ? (
                  <CompletionEditor
                    activity={s}
                    existingAssets={data.activityAssets.filter(
                      (a) => a.activity_id === s.id,
                    )}
                    onSaved={saved}
                    onCancel={() => setEditing(false)}
                  />
                ) : section === "users" ? (
                  <UserForm
                    onSaved={saved}
                    onCancel={() => setEditing(false)}
                  />
                ) : (
                  <RecordEditor
                    key={s.id || "new"}
                    module={section}
                    record={s}
                    data={data}
                    onSaved={saved}
                    onCancel={() => setEditing(false)}
                  />
                )
              ) : (
                <>
                  <Detail record={s} data={data} />
                  {section === "profiles" && (
                    <>
                      <h3>Supporting documents</h3>
                      {data.documents
                        .filter((d) => d.trainer_id === s.id)
                        .map((d) => (
                          <p key={d.asset_id}>
                            <AssetLink id={d.asset_id} />
                          </p>
                        ))}
                      {s.photo_asset_id && (
                        <AssetLink id={s.photo_asset_id}>
                          Profile photo
                        </AssetLink>
                      )}
                    </>
                  )}
                  {["activities", "completion"].includes(section) && (
                    <>
                      <h3>Assigned trainers</h3>
                      {data.assignments
                        .filter((t) => t.activity_id === s.id)
                        .map((t) => (
                          <p key={t.trainer_id}>
                            {
                              data.profiles.find((p) => p.id === t.trainer_id)
                                ?.name
                            }{" "}
                            · {t.role}
                          </p>
                        ))}
                      {s.poster_asset_id && (
                        <p>
                          <AssetLink id={s.poster_asset_id}>Poster</AssetLink>
                        </p>
                      )}
                      {data.activityAssets
                        .filter((a) => a.activity_id === s.id)
                        .map((a) => (
                          <p key={a.asset_id}>
                            <AssetLink id={a.asset_id}>{a.purpose}</AssetLink>
                          </p>
                        ))}
                    </>
                  )}
                  <label>
                    Admin comment
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Explain a decision or the amendment needed"
                      rows="3"
                    />
                  </label>
                  {modules[section] && (
                    <>
                      <button onClick={() => setEditing(true)}>
                        Edit record
                      </button>
                      {section !== "certificates" &&
                        actions(
                          [
                            ["approve", "Approve"],
                            ["return", "Return"],
                            ["publish", "Publish"],
                            ["unpublish", "Unpublish"],
                            ["archive", "Archive"],
                            ...(section === "organisations"
                              ? [["remove", "Remove listing"]]
                              : []),
                          ],
                          "/admin/" + section + "/" + s.id + "/action",
                        )}
                    </>
                  )}
                  {section === "requests" &&
                    ["submitted", "returned"].includes(s.status) && (
                      <div className="ad-actions">
                        {["approved", "returned", "rejected"].map(
                          (decision) => (
                            <button
                              disabled={busy}
                              key={decision}
                              onClick={() =>
                                run("/admin/requests/" + s.id + "/review", {
                                  decision,
                                  comment,
                                })
                              }
                            >
                              {decision === "approved"
                                ? "Verify & activate"
                                : decision === "returned"
                                  ? "Return for amendment"
                                  : "Reject"}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  {section === "profiles" && s.status === "submitted" && (
                    <ProfileReview
                      profile={s}
                      comment={comment}
                      run={run}
                      busy={busy}
                    />
                  )}
                  {section === "profiles" && s.status !== "submitted" && (
                    <ProfileCertification profile={s} run={run} busy={busy} />
                  )}
                  {section === "activities" && (
                    <>
                      <div className="ad-actions">
                        {["draft", "returned"].includes(s.status) &&
                          s.lifecycle === "planned" && (
                            <>
                              <button onClick={() => setEditing(true)}>
                                Edit activity
                              </button>
                              <button
                                disabled={busy}
                                onClick={() =>
                                  run("/activities/" + s.id + "/submit", {})
                                }
                              >
                                Submit for review
                              </button>
                            </>
                          )}
                      </div>
                      {actions(
                        [
                          ...(s.status === "submitted"
                            ? [
                                ["approve", "Approve"],
                                ["return", "Return"],
                              ]
                            : []),
                          ...(s.status === "approved" &&
                          s.lifecycle === "planned"
                            ? [["publish", "Publish"]]
                            : []),
                          ...(["published", "planned"].includes(s.lifecycle)
                            ? [
                                ["unpublish", "Unpublish / amend"],
                                ["cancel", "Cancel activity"],
                              ]
                            : []),
                          ...(["completed", "verified"].includes(s.lifecycle)
                            ? [["archive", "Archive"]]
                            : []),
                          ...(s.completion_status === "verified"
                            ? [["reopen", "Reopen completion"]]
                            : []),
                        ],
                        "/admin/activities/" + s.id + "/action",
                      )}
                      {s.status === "approved" &&
                        !["submitted", "verified"].includes(
                          s.completion_status,
                        ) &&
                        ["planned", "published", "completed"].includes(
                          s.lifecycle,
                        ) && (
                          <button
                            onClick={() => {
                              setSection("completion");
                              setEditing(true);
                            }}
                          >
                            Add completion record
                          </button>
                        )}
                    </>
                  )}
                  {section === "completion" &&
                    actions(
                      s.completion_status === "submitted"
                        ? [
                            ["verify", "Verify completion & hours"],
                            ["return_completion", "Return completion"],
                          ]
                        : [],
                      "/admin/activities/" + s.id + "/action",
                    )}
                  {section === "users" && (
                    <button
                      disabled={busy || s.id === auth.user.id}
                      onClick={() =>
                        run("/admin/users/" + s.id + "/access", {
                          active: !s.active,
                        })
                      }
                    >
                      {s.active ? "Deactivate account" : "Activate account"}
                    </button>
                  )}
                  {section === "subscribers" && !s.unsubscribed_at && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        run("/admin/subscribers/" + s.id + "/unsubscribe", {})
                      }
                    >
                      Unsubscribe
                    </button>
                  )}
                  {section === "enquiries" && (
                    <div className="ad-actions">
                      {["in_progress", "resolved"].map((v) => (
                        <button
                          key={v}
                          disabled={busy}
                          onClick={() =>
                            run("/admin/enquiries/" + s.id, {
                              status: v,
                              admin_comment: comment,
                            })
                          }
                        >
                          Mark {v.replaceAll("_", " ")}
                        </button>
                      ))}
                    </div>
                  )}
                  {section === "assets" && (
                    <>
                      <AssetLink id={s.id}>Open file</AssetLink>
                      <div className="ad-actions">
                        <button
                          disabled={busy}
                          onClick={() =>
                            run("/admin/assets/" + s.id + "/review", {
                              publication_approved: !s.publication_approved,
                              rights_note: comment,
                            })
                          }
                        >
                          {s.publication_approved
                            ? "Revoke public permission"
                            : "Approve public use"}
                        </button>
                      </div>
                      <p className="ad-small">
                        Record copyright / consent evidence in the Admin
                        comment. Supporting documents remain private.
                      </p>
                    </>
                  )}
                </>
              )}
              {error && (
                <p className="ad-error" role="alert">
                  {error}
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
function ProfileReview({ profile, comment, run, busy }) {
  const [status, setStatus] = useState(profile.certified_status),
    [reference, setReference] = useState(profile.certificate_reference || "");
  return (
    <>
      <label>
        Certified status
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {["pending", "certified", "suspended", "revoked"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        Certificate reference
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </label>
      <div className="ad-actions">
        {["approved", "returned"].map((decision) => (
          <button
            disabled={busy}
            key={decision}
            onClick={() =>
              run("/admin/profiles/" + profile.id + "/review", {
                decision,
                comment,
                certified_status: status,
                ...(reference ? { certificate_reference: reference } : {}),
              })
            }
          >
            {decision === "approved"
              ? "Approve profile"
              : "Return for amendment"}
          </button>
        ))}
      </div>
    </>
  );
}
function ProfileCertification({ profile, run, busy }) {
  const [certified_status, setStatus] = useState(profile.certified_status),
    [certificate_reference, setReference] = useState(
      profile.certificate_reference || "",
    );
  return (
    <>
      <label>
        Certification
        <select
          value={certified_status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {["pending", "certified", "suspended", "revoked"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        Certificate reference
        <input
          value={certificate_reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </label>
      <button
        disabled={busy}
        onClick={() =>
          run("/admin/profiles/" + profile.id + "/certification", {
            certified_status,
            certificate_reference,
          })
        }
      >
        Update certification
      </button>
    </>
  );
}
