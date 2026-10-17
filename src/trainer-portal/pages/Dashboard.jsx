import { Link } from "react-router-dom";
import { useTrainer } from "../TrainerContext";
import { Badge } from "../../shared/RecordFields";
export default function Dashboard() {
  const { state } = useTrainer();
  const current = state.annual.find((r) => r.year === new Date().getFullYear());
  const counts = [
    ["Profile status", state.profile.status],
    [
      "Pending review",
      state.activities.filter(
        (a) => a.status === "submitted" || a.completion_status === "submitted",
      ).length + (state.profile.status === "submitted" ? 1 : 0),
    ],
    ["Verified activities", current?.activities_conducted || 0],
    ["Verified hours", current?.verified_hours || 0],
    ["Participant reach", current?.participants_reached || 0],
  ];
  return (
    <>
      <h2>Your contribution at a glance</h2>
      <div className="ad-cards">
        {counts.map(([label, value]) => (
          <div className="ad-card" key={label}>
            <p>{label}</p>
            <h2>{value}</h2>
          </div>
        ))}
      </div>
      <section className="ad-card">
        <h3>Upcoming approved activities</h3>
        {state.activities
          .filter(
            (a) =>
              a.status === "approved" && new Date(a.starts_at) > new Date(),
          )
          .map((a) => (
            <p key={a.id}>
              {a.title} · {new Date(a.starts_at).toLocaleString("en-MY")}{" "}
              <Badge>{a.lifecycle}</Badge>
            </p>
          ))}
        <Link to="/trainer-portal/activities">
          Manage workshops & seminars →
        </Link>
      </section>
    </>
  );
}
