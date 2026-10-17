import { useState } from "react";
import { useTrainer } from "../TrainerContext";
import { Badge, AssetLink } from "../../shared/RecordFields";
import CompletionEditor from "../../shared/CompletionEditor";
export default function Conducted() {
  const { state, refresh } = useTrainer();
  const [editing, setEditing] = useState(null);
  const eligible = state.activities.filter(
    (a) => a.status === "approved" && a.lifecycle !== "cancelled",
  );
  return (
    <section>
      <h2>Workshops & Seminars Conducted</h2>
      <p>Add completion details to the original activity after it has ended.</p>
      {editing ? (
        <div className="ad-card">
          <CompletionEditor
            activity={editing}
            existingAssets={state.activityAssets.filter(
              (a) => a.activity_id === editing.id,
            )}
            onSaved={async () => {
              await refresh();
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : (
        <div className="ad-cards">
          {eligible.map((a) => (
            <article className="ad-card" key={a.id}>
              <h3>{a.title}</h3>
              <p>{new Date(a.starts_at).toLocaleString("en-MY")}</p>
              <Badge>{a.completion_status || "not submitted"}</Badge>
              {a.completion_admin_comment && (
                <p>Admin: {a.completion_admin_comment}</p>
              )}
              {state.activityAssets
                .filter((f) => f.activity_id === a.id)
                .map((f) => (
                  <p key={f.asset_id}>
                    <AssetLink id={f.asset_id}>{f.purpose}</AssetLink>
                  </p>
                ))}
              {(!a.completion_status || a.completion_status === "returned") &&
                new Date(a.ends_at || a.starts_at) <= new Date() &&
                a.lifecycle !== "archived" && (
                  <div className="ad-actions">
                    <button onClick={() => setEditing(a)}>
                      Add / amend completion
                    </button>
                  </div>
                )}
            </article>
          ))}
        </div>
      )}
      {!eligible.length && <p>No approved activities yet.</p>}
    </section>
  );
}
