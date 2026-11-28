
import { useEffect, useState } from "react";
import { api } from "../trainer-portal/TrainerContext";

const MODES = [
  {
    value: "closed",
    title: "Closed",
    description: "No listing requests are accepted."
  },
  {
    value: "invitation_only",
    title: "Invitation Only",
    description: "Only applicants with a valid invitation code can submit."
  },
  {
    value: "open",
    title: "Open",
    description: "Organisations can submit listing requests publicly."
  }
];

const STATUS_LABELS = {
  new: "New",
  in_review: "In review",
  closed: "Closed"
};

const TYPE_LABELS = {
  apply: "Apply for a Listing",
  update: "Request to Update a Listing"
};

function formatDate(value) {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function invitationStatus(invitation) {
  if (invitation.revoked_at) return "Revoked";
  if (invitation.used_at) return "Used";

  if (
    new Date(invitation.expires_at).getTime() <= Date.now()
  ) {
    return "Expired";
  }

  return "Active";
}

export default function ListingRequestManager() {
  const [mode, setMode] = useState("closed");
  const [savedMode, setSavedMode] = useState("closed");

  const [requests, setRequests] = useState([]);
  const [invitations, setInvitations] = useState([]);

  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState("apply");
  const [generatedToken, setGeneratedToken] = useState("");
  const [generatedExpiry, setGeneratedExpiry] = useState("");

  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setLoadFailed(false);

    try {
      const [settings, requestRows, invitationRows] =
        await Promise.all([
          api("/api/admin/listing-request-settings"),
          api("/api/admin/listing-requests"),
          api("/api/admin/listing-request-invitations")
        ]);

      if (
        !MODES.some(item => item.value === settings.mode) ||
        !Array.isArray(requestRows) ||
        !Array.isArray(invitationRows)
      ) {
        throw new Error("Invalid server response.");
      }

      setMode(settings.mode);
      setSavedMode(settings.mode);
      setRequests(requestRows);
      setInvitations(invitationRows);
    } catch (err) {
      setLoadFailed(true);
      setError(err.message || "Unable to load listing requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function perform(action) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await action();
    } catch (err) {
      setError(err.message || "Unable to complete the action.");
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(event) {
    event.preventDefault();

    if (busy || mode === savedMode) return;

    await perform(async () => {
      const result = await api(
        "/api/admin/listing-request-settings",
        { mode }
      );

      setMode(result.mode);
      setSavedMode(result.mode);
      setNotice("Submission settings saved successfully.");
    });
  }

  async function generateInvitation(event) {
    event.preventDefault();

    if (busy) return;

    setGeneratedToken("");
    setGeneratedExpiry("");

    await perform(async () => {
      const result = await api(
        "/api/admin/listing-request-invitations",
        {
          email: email.trim(),
          request_type: requestType
        }
      );

      setGeneratedToken(result.token);
      setGeneratedExpiry(result.expires_at);
      setEmail("");

      const rows = await api(
        "/api/admin/listing-request-invitations"
      );

      setInvitations(rows);
      setNotice("Invitation generated successfully.");
    });
  }

  async function revokeInvitation(id) {
    if (busy) return;

    if (
      !window.confirm(
        "Revoke this invitation? It will no longer be usable."
      )
    ) {
      return;
    }

    await perform(async () => {
      await api(
        "/api/admin/listing-request-invitations",
        { id, revoke: true }
      );

      setGeneratedToken("");
      setGeneratedExpiry("");

      const rows = await api(
        "/api/admin/listing-request-invitations"
      );

      setInvitations(rows);
      setNotice("Invitation revoked.");
    });
  }

  async function copyInvitation() {
    try {
      await navigator.clipboard.writeText(generatedToken);
      setNotice("Invitation code copied.");
      setError("");
    } catch {
      setError(
        "Unable to copy automatically. Select and copy the code manually."
      );
    }
  }

  async function saveReview(event) {
    event.preventDefault();

    if (!editing || busy) return;

    if (
      editing.status !== "new" &&
      !editing.admin_note.trim()
    ) {
      setError("Enter an admin review note before saving.");
      return;
    }

    await perform(async () => {
      await api("/api/admin/listing-requests", {
        id: editing.id,
        status: editing.status,
        admin_note: editing.admin_note.trim()
      });

      const rows = await api(
        "/api/admin/listing-requests"
      );

      setRequests(rows);
      setEditing(null);
      setNotice("Request review saved successfully.");
    });
  }

  const filteredRequests =
    filter === "all"
      ? requests
      : requests.filter(row => row.status === filter);

  const counts = {
    new: requests.filter(row => row.status === "new").length,
    in_review: requests.filter(
      row => row.status === "in_review"
    ).length,
    closed: requests.filter(
      row => row.status === "closed"
    ).length
  };

  return (
    <section
      className="tp-card"
      aria-labelledby="listing-manager-heading"
    >
      <h2 id="listing-manager-heading">
        Listing Request Management
      </h2>

      <p>
        Manage listing applications, invitations and requests
        to update existing community resources.
      </p>

      {notice && (
        <p className="tp-note" role="status">
          {notice}
        </p>
      )}

      {error && (
        <p className="tp-note" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <p role="status">Loading listing requests...</p>
      )}

      {!loading && loadFailed && (
        <button
          type="button"
          className="tp-btn"
          onClick={load}
        >
          Try again
        </button>
      )}

      {!loading && !loadFailed && (
        <>
          {/* SUBMISSION SETTINGS */}

          <form
            className="tp-card"
            onSubmit={saveSettings}
          >
            <h3>Submission settings</h3>

            <p>
              Current mode:{" "}
              <strong>
                {MODES.find(
                  item => item.value === savedMode
                )?.title}
              </strong>
            </p>

            <fieldset
              disabled={busy}
              style={{
                border: 0,
                padding: 0,
                margin: "20px 0"
              }}
            >
              <legend>
                Choose the submission availability
              </legend>

              {MODES.map(item => (
                <label
                  key={item.value}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "15px",
                    marginBottom: "10px",
                    border: "1px solid #ddd6e5",
                    borderRadius: "12px",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="radio"
                    name="listing-submission-mode"
                    value={item.value}
                    checked={mode === item.value}
                    onChange={() => setMode(item.value)}
                    style={{ marginTop: "5px" }}
                  />

                  <span>
                    <strong>{item.title}</strong>
                    <span
                      style={{
                        display: "block",
                        marginTop: "5px"
                      }}
                    >
                      {item.description}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>

            <button
              className="tp-btn"
              type="submit"
              disabled={busy || mode === savedMode}
            >
              {busy ? "Please wait..." : "Save settings"}
            </button>
          </form>

          {/* INVITATION GENERATION */}

          <form
            className="tp-card"
            onSubmit={generateInvitation}
          >
            <h3>Invitation management</h3>

            <p>
              Generate a single-use invitation for an
              organisation. Invitations expire after seven
              days and must match the applicant's email
              and request type.
            </p>

            <p>
              Invitation codes can be used when submission
              availability is set to Invitation Only.
            </p>

            <label
              className="tp-field"
              htmlFor="listing-invite-email"
            >
              Organisation email
            </label>

            <input
              id="listing-invite-email"
              type="email"
              required
              maxLength={254}
              value={email}
              disabled={busy}
              onChange={event =>
                setEmail(event.target.value)
              }
              style={{ width: "100%" }}
            />

            <label
              className="tp-field"
              htmlFor="listing-invite-type"
            >
              Request type
            </label>

            <select
              id="listing-invite-type"
              value={requestType}
              disabled={busy}
              onChange={event =>
                setRequestType(event.target.value)
              }
              style={{ width: "100%" }}
            >
              <option value="apply">
                Apply for a Listing
              </option>

              <option value="update">
                Request to Update a Listing
              </option>
            </select>

            <div className="tp-actions">
              <button
                type="submit"
                className="tp-btn"
                disabled={busy}
              >
                Generate invitation code
              </button>
            </div>

            {generatedToken && (
              <div className="tp-card">
                <h4>Invitation generated</h4>

                <p>
                  Copy this code and share it privately
                  with the intended organisation.
                  The code cannot be retrieved again.
                </p>

                <label
                  className="tp-field"
                  htmlFor="generated-listing-token"
                >
                  Invitation code
                </label>

                <textarea
                  id="generated-listing-token"
                  readOnly
                  rows={3}
                  value={generatedToken}
                  style={{
                    width: "100%",
                    fontFamily: "monospace"
                  }}
                />

                <p>
                  Expires: {formatDate(generatedExpiry)}
                </p>

                <div className="tp-actions">
                  <button
                    className="tp-btn"
                    type="button"
                    onClick={copyInvitation}
                  >
                    Copy invitation code
                  </button>

                  <button
                    className="tp-btn tp-btn-ghost"
                    type="button"
                    onClick={() => {
                      setGeneratedToken("");
                      setGeneratedExpiry("");
                    }}
                  >
                    Hide code
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* INVITATION HISTORY */}

          <div className="tp-card">
            <h3>Issued invitations</h3>

            {invitations.length === 0 && (
              <p>No invitations have been generated yet.</p>
            )}

            {invitations.map(invitation => {
              const status =
                invitationStatus(invitation);

              return (
                <article
                  className="tp-card"
                  key={invitation.id}
                >
                  <h4
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {invitation.email}
                  </h4>

                  <p>
                    {TYPE_LABELS[invitation.request_type]}
                  </p>

                  <p>
                    <strong>Status:</strong> {status}
                  </p>

                  <p>
                    Created:{" "}
                    {formatDate(invitation.created_at)}
                  </p>

                  <p>
                    Expires:{" "}
                    {formatDate(invitation.expires_at)}
                  </p>

                  {status === "Active" && (
                    <button
                      className="tp-btn tp-btn-ghost"
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        revokeInvitation(invitation.id)
                      }
                    >
                      Revoke invitation
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          {/* REQUEST REVIEW QUEUE */}

          <div className="tp-card">
            <h3>Submitted listing requests</h3>

            <p>
              Review each request before creating or
              modifying any public directory listing.
              Closing a request does not publish it.
            </p>

            <p>
              <strong>New:</strong> {counts.new}
              {" | "}
              <strong>In review:</strong> {counts.in_review}
              {" | "}
              <strong>Closed:</strong> {counts.closed}
            </p>

            <small>
              Counts reflect the latest requests returned
              by the server (up to 200).
            </small>

            <div className="tp-toolbar">
              <label
                className="tp-field"
                htmlFor="listing-request-filter"
              >
                Filter by status
              </label>

              <select
                id="listing-request-filter"
                value={filter}
                onChange={event =>
                  setFilter(event.target.value)
                }
              >
                <option value="all">All requests</option>
                <option value="new">New</option>
                <option value="in_review">In review</option>
                <option value="closed">Closed</option>
              </select>

              <button
                className="tp-btn tp-btn-ghost"
                type="button"
                disabled={busy || Boolean(editing)}
                onClick={load}
              >
                Refresh
              </button>
            </div>

            {filteredRequests.length === 0 && (
              <p role="status">
                No matching listing requests.
              </p>
            )}

            {filteredRequests.map(request => (
              <article
                className="tp-card"
                key={request.id}
                style={{ overflowWrap: "anywhere" }}
              >
                <h3>{request.organisation_name}</h3>

                <p>
                  {TYPE_LABELS[request.request_type]}
                </p>

                <span
                  className={
                    request.status === "closed"
                      ? "tp-chip tp-chip-grey"
                      : "tp-chip tp-chip-amber"
                  }
                >
                  {STATUS_LABELS[request.status]}
                </span>

                <p>
                  <strong>Contact:</strong>{" "}
                  {request.contact_name}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${request.email}`}>
                    {request.email}
                  </a>
                </p>

                {request.phone && (
                  <p>
                    <strong>Phone:</strong>{" "}
                    {request.phone}
                  </p>
                )}

                {request.listing_id && (
                  <p>
                    <strong>Listing reference:</strong>{" "}
                    {request.listing_id}
                  </p>
                )}

                <p>
                  <strong>Submitted:</strong>{" "}
                  {formatDate(request.submitted_at)}
                </p>

                <p>
                  <strong>Consent recorded:</strong>{" "}
                  {formatDate(request.consent_at)}
                </p>

                <details>
                  <summary
                    style={{
                      cursor: "pointer",
                      padding: "10px 0",
                      fontWeight: 700
                    }}
                  >
                    View request details
                  </summary>

                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {request.details}
                  </p>
                </details>

                {request.admin_note && (
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    <strong>Admin note:</strong>{" "}
                    {request.admin_note}
                  </p>
                )}

                <p>
                  <small>
                    Request ID: {request.id}
                  </small>
                </p>

                {editing?.id !== request.id && (
                  <button
                    className="tp-btn tp-btn-ghost"
                    type="button"
                    disabled={busy || Boolean(editing)}
                    onClick={() => {
                      setError("");

                      setEditing({
                        id: request.id,
                        status: request.status,
                        admin_note: request.admin_note || ""
                      });
                    }}
                  >
                    Review request
                  </button>
                )}

                {editing?.id === request.id && (
                  <form
                    className="tp-card"
                    onSubmit={saveReview}
                  >
                    <h4>Review request</h4>

                    <label
                      className="tp-field"
                      htmlFor={`review-status-${request.id}`}
                    >
                      Review status
                    </label>

                    <select
                      id={`review-status-${request.id}`}
                      value={editing.status}
                      disabled={busy}
                      onChange={event =>
                        setEditing(current => ({
                          ...current,
                          status: event.target.value
                        }))
                      }
                    >
                      <option value="new">New</option>
                      <option value="in_review">
                        In review
                      </option>
                      <option value="closed">
                        Closed
                      </option>
                    </select>

                    <label
                      className="tp-field"
                      htmlFor={`review-note-${request.id}`}
                    >
                      Admin review note
                    </label>

                    <textarea
                      id={`review-note-${request.id}`}
                      rows={5}
                      maxLength={5000}
                      required={editing.status !== "new"}
                      disabled={busy}
                      value={editing.admin_note}
                      onChange={event =>
                        setEditing(current => ({
                          ...current,
                          admin_note: event.target.value
                        }))
                      }
                      style={{ width: "100%" }}
                    />

                    <div className="tp-actions">
                      <button
                        className="tp-btn"
                        type="submit"
                        disabled={busy}
                      >
                        Save review
                      </button>

                      <button
                        className="tp-btn tp-btn-ghost"
                        type="button"
                        disabled={busy}
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
