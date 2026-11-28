import { useState } from "react";
import {Link} from 'react-router-dom';
import { useTrainer } from "../../trainer-portal/TrainerContext";
import { buildQueue } from "../../trainer-portal/selectors";
import { eventDateTime } from "../../../shared/event-dates";
import { Field } from "../../trainer-portal/ui";

const DECISION_LABEL = {
  approved: "Approved",
  verified: "Verified",
  returned: "Returned for amendment",
  rejected: "Rejected",
  created: "Created",
  updated: "Updated",
  published: "Published",
  unpublished: "Unpublished",
  cancelled: "Cancelled",
  archived: "Archived",
  restored: "Restored as draft",
  reviewed: "Marked as reviewed",
  INSERT: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
};

// Plain names for the database tables recorded in the audit log.
const RECORD_LABEL = {
  trainer_access_requests: "Trainer application",
  trainer_profiles: "Trainer profile",
  users: "User account",
  activities: "Activity",
  completions: "Completed activity",
  activity_trainers: "Activity trainers",
  subscribers: "Get Updated subscriber",
  learning_resources: "Learning resource",
  trainer_listing: "Public listing"
};

export default function ReviewQueue() {
  const { state, dispatch } = useTrainer();
  const queue = buildQueue(state);
  const pendingPublication = state.activities.filter(activity => activity.contentApprovalStatus === "pending" && !activity.cancelledAt).length;
  const [comments, setComments] = useState({});
  const [refs, setRefs] = useState({});
  const [errors, setErrors] = useState({});

  const refFor = (item) =>
    refs[item.key] ?? (item.claimedRef === "Not provided" ? "" : item.claimedRef ?? "");

  async function decide(item, decision) {
    const comment = (comments[item.key] ?? "").trim();
    if (!["approved", "published"].includes(decision) && !comment) {
      setErrors((e) => ({ ...e, [item.key]: "Please add a short comment so the trainer knows why." }));
      return;
    }
    const certificateRef = refFor(item).trim();
    if (item.target === "access" && decision === "approved" && !certificateRef) {
      setErrors((e) => ({ ...e, [item.key]: "Enter the official certificate reference before approving." }));
      return;
    }
    setErrors((e) => ({ ...e, [item.key]: "" }));
    await dispatch({
      type: "ADMIN_REVIEW", target: item.target, id: item.id, decision, comment,
      ...(item.target === "access" ? { certificateRef } : {}),
    });
  }

  return (
    <>
      <h1>Approvals</h1>
      <section className="tp-card"><h2>Education &amp; Events reviews</h2><p>Choose what you want to review.</p><div className="tp-actions"><Link className="tp-btn tp-btn-ghost" to="/admin/learn-events?section=library&review=pending">Review publication &amp; webinar materials ({pendingPublication} pending)</Link><Link className="tp-btn tp-btn-ghost" to="/admin/dcs-registry?tab=review">Review training records &amp; public consent</Link><Link className="tp-btn tp-btn-ghost" to="/admin/contribution">Review individual contributions</Link></div></section>

      <h2>Requests and submissions</h2>
      {queue.length === 0 && <p className="tp-card">No requests in this queue. Use the links above to check publication, training records and contributions.</p>}

      <ul className="tp-cards">
        {queue.map((item) => (
          <li key={item.key} className="tp-card">
            <p className="tp-dev">{item.kind}</p>
            <h2>{item.title}</h2>
            <p>{item.detail}</p>
            {item.profile?.status==="submitted"&&<details open><summary>Compare submitted changes with the approved public profile</summary><div style={{overflowX:"auto"}}><table className="tp-table"><thead><tr><th>Field</th><th>Approved</th><th>Submitted</th></tr></thead><tbody>{["city","language","short_profile","qualifications","experience","photo_url","contact_email","contact_phone"].map(key=><tr key={key}><th>{key.replaceAll("_"," ")}</th><td>{item.profile.approved_snapshot?.[key]||"Not approved"}</td><td>{item.profile[key]||"—"}</td></tr>)}</tbody></table></div></details>}
            {item.profile && (
              <dl className="tp-dl">
                <dt>Assessment result</dt><dd>{item.profile.assessment_result || "Not recorded"}</dd>
                <dt>Healthcare professional</dt><dd>{item.profile.healthcare_professional == null ? "Not recorded" : item.profile.healthcare_professional ? "Yes" : "No"}</dd>
                <dt>Independent teaching scope</dt><dd>{item.profile.independent_teaching_scope || "Not recorded"}</dd>
                <dt>Short profile</dt><dd>{item.profile.shortProfile || "–"}</dd>
                <dt>Qualifications</dt><dd>{item.profile.qualifications || "–"}</dd>
                <dt>Relevant experience</dt><dd>{item.profile.experience || "–"}</dd>
                <dt>Profile photo</dt>
                <dd>{item.profile.photoUrl ? <a href={item.profile.photoUrl} target="_blank" rel="noreferrer">View photo</a> : "–"}</dd>
                <dt>Supporting documents</dt>
                <dd>
                  {(item.profile.supportingDocuments || []).length === 0 ? "–" :
                    item.profile.supportingDocuments.map((url, i) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">Document {i + 1} </a>
                    ))}
                </dd>
              </dl>
            )}
            {item.trainerHours&&<ul>{item.trainerHours.map(t=><li key={t.trainerId}>{t.name||"Assigned trainer"}: {t.hours??"Not recorded"} hours ({t.role})</li>)}</ul>}
            {item.certificateEvidenceUrl && <p><a href={item.certificateEvidenceUrl} target="_blank" rel="noreferrer">Open private certificate image or PDF</a></p>}
            {item.profile?.certificateEvidenceUrl && <p><a href={item.profile.certificateEvidenceUrl} target="_blank" rel="noreferrer">Open private certificate image or PDF</a></p>}
            {item.target === "access" && (
                <Field
                    id={`ref-${item.key}`}
                    label="Certificate reference (check it matches RCBC records)"
                    example="Enter the certificate reference as recorded by RCBC before approving access."
                >
                    <input
                        id={`ref-${item.key}`}
                        value={refFor(item)}
                        onChange={(e) => setRefs({ ...refs, [item.key]: e.target.value })}
                    />
                </Field>
                )}
                <Field
                    id={`c-${item.key}`}
                    label="Comment for the trainer (required to return or reject)"
                    example="Explain what needs to change for a returned request, or why the request was rejected."
                    error={errors[item.key]}
                >
                <textarea
                id={`c-${item.key}`}
                rows="2"
                value={comments[item.key] ?? ""}
                onChange={(e) => setComments({ ...comments, [item.key]: e.target.value })}
                aria-invalid={Boolean(errors[item.key])}
                aria-describedby={errors[item.key] ? `c-${item.key}-error` : undefined}
              />
            </Field>
            <div className="tp-actions">
              <button className="tp-btn" onClick={() => decide(item, item.approveDecision || "approved")}>
                {item.approveLabel}
              </button>
              <button className="tp-btn tp-btn-ghost" onClick={() => decide(item, "returned")}>
                Return for amendment
              </button>
              {item.canReject && (
                <button className="tp-btn tp-btn-ghost" onClick={() => decide(item, "rejected")}>
                  Reject
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h2>Recent activity</h2>
      <div className="tp-table-wrap" role="region" aria-label="Recent activity" tabIndex={0}>
        <table className="tp-table tp-admin-history">
          <caption className="tp-sr">Recent activity</caption>
          <thead>
            <tr>
              <th>When</th>
              <th>Item</th>
              <th>What happened</th>
              <th>By</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {state.history.slice(0, 10).map((h) => (
              <tr key={h.id}>
                <td>
                  {eventDateTime(h.at)}
                </td>
                <td>{RECORD_LABEL[h.entity] ?? h.entity}: {h.entityLabel}</td>
                <td>{DECISION_LABEL[h.decision] ?? h.decision}</td>
                <td>{h.by}</td>
                <td>{h.comment?.startsWith("Legacy CMS material:")
                  ? "Imported for RCBC review. Check the source, linked activity and publication permissions."
                  : h.comment || "—"}</td>
              </tr>
            ))}
            {state.history.length === 0 && (
              <tr><td colSpan="5">Nothing yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
