import { useTrainer } from "../TrainerContext";
import { Badge } from "../../shared/RecordFields";
export default function Hours() {
  const { state } = useTrainer();
  return (
    <section>
      <h2>Contribution & Training Hours</h2>
      <p>
        Calculated from Admin-verified completion records. Archived verified
        activities continue to count.
      </p>
      <div className="ad-cards">
        {state.annual.map((r) => (
          <section className="ad-card" key={r.year}>
            <h3>{r.year}</h3>
            <p>
              {r.activities_conducted} activities · {r.verified_hours} hours ·{" "}
              {r.participants_reached} participant attendances
            </p>
          </section>
        ))}
      </div>
      <div className="ad-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Role</th>
              <th>Hours</th>
              <th>Participants</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {state.activities
              .filter((a) => a.completion_status)
              .map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{a.role}</td>
                  <td>
                    {a.completion_status === "verified" ? a.actual_hours : "—"}
                  </td>
                  <td>
                    {a.completion_status === "verified"
                      ? a.participant_count
                      : "—"}
                  </td>
                  <td>
                    <Badge>{a.completion_status}</Badge>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
