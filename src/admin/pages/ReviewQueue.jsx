import { useState } from "react";
import { useTrainer } from "../../trainer-portal/TrainerContext";
import { buildQueue } from "../../trainer-portal/selectors";
import { Field } from "../../trainer-portal/ui";

const DECISION_LABEL = {
  approved: "Approved",
  verified: "Verified",
  returned: "Returned for amendment",
  rejected: "Rejected",
};

export default function ReviewQueue() {
  const { state, dispatch } = useTrainer();
  const queue = buildQueue(state);
  const [comments, setComments] = useState({});
  const [errors, setErrors] = useState({});

  function decide(item, decision) {
    const comment = (comments[item.key] ?? "").trim();
    if (decision !== "approved" && !comment) {
      setErrors((e) => ({ ...e, [item.key]: "Please add a short comment so the trainer knows why." }));
      return;
    }
    dispatch({ type: "ADMIN_REVIEW", target: item.target, id: item.id, decision, comment });
    setErrors((e) => ({ ...e, [item.key]: "" }));
  }

  return (
    <>
      <h1>Review queue</h1>
      <p>
        Trainers submit and Admin reviews. Approving keeps the same record. Returning needs a short
        comment, which the trainer sees.
      </p>

      {queue.length === 0 && <p className="tp-card">Nothing is waiting for review.</p>}

      <ul className="tp-cards">
        {queue.map((item) => (
          <li key={item.key} className="tp-card">
            <p className="tp-dev">{item.kind}</p>
            <h2>{item.title}</h2>
            <p>{item.detail}</p>
            <Field
              id={`c-${item.key}`}
              label="Comment (needed when returning or rejecting)"
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
              <button className="tp-btn" onClick={() => decide(item, "approved")}>{item.approveLabel}</button>
              <button className="tp-btn tp-btn-ghost" onClick={() => decide(item, "returned")}>Return for amendment</button>
              {item.canReject && (
                <button className="tp-btn tp-btn-ghost" onClick={() => decide(item, "rejected")}>Reject</button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h2>Recent decisions</h2>
      <div className="tp-table-wrap">
        <table className="tp-table">
          <caption className="tp-sr">Status history</caption>
          <thead>
            <tr><th>When</th><th>Record</th><th>Decision</th><th>By</th><th>Comment</th></tr>
          </thead>
          <tbody>
            {state.history.slice(0, 10).map((h) => (
              <tr key={h.id}>
                <td>{new Date(h.at).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td>{h.entity}: {h.entityLabel}</td>
                <td>{DECISION_LABEL[h.decision] ?? h.decision}</td>
                <td>{h.by}</td>
                <td>{h.comment || "–"}</td>
              </tr>
            ))}
            {state.history.length === 0 && <tr><td colSpan="5">No decisions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}