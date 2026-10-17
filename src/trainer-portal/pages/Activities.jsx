import { useState } from "react";
import { useTrainer } from "../TrainerContext";
import { Badge } from "../../shared/RecordFields";
import ActivityEditor from "../../shared/ActivityEditor";
import { post } from "../../shared/api";
export default function Activities() {
  const { state, refresh } = useTrainer();
  const [editing, setEditing] = useState(null),
    [error, setError] = useState("");
  return (
    <section>
      <div className="ad-heading">
        <h2>Workshop & Seminar</h2>
        <button onClick={() => setEditing({})}>+ New workshop / seminar</button>
      </div>
      {error && (
        <p role="alert" className="ad-error">
          {error}
        </p>
      )}
      {editing ? (
        <div className="ad-card">
          <ActivityEditor
            key={editing.id || "new"}
            record={editing}
            organisations={state.organisations || []}
            onSaved={async () => {
              await refresh();
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : (
        <div className="ad-cards">
          {state.activities.map((a) => (
            <article className="ad-card" key={a.id}>
              <h3>{a.title}</h3>
              <p>
                {new Date(a.starts_at).toLocaleString("en-MY")} · {a.mode} ·{" "}
                {a.language_code}
              </p>
              <Badge>{a.status}</Badge> <Badge>{a.lifecycle}</Badge>
              {a.admin_comment && <p>Admin: {a.admin_comment}</p>}
              {["draft", "returned"].includes(a.status) &&
                a.lifecycle === "planned" && (
                  <div className="ad-actions">
                    <button onClick={() => setEditing(a)}>Edit</button>
                    <button
                      className="ad-secondary"
                      onClick={async () => {
                        try {
                          await post("/activities/" + a.id + "/submit");
                          await refresh();
                        } catch (e) {
                          setError(e.message);
                        }
                      }}
                    >
                      Submit for review
                    </button>
                  </div>
                )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
