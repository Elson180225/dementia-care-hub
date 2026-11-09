import FormFeedback from "../components/FormFeedback";
import AccountForm from "../trainer-portal/AccountForm";
import { Fragment } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTrainer } from "../trainer-portal/TrainerContext";
import { buildQueue } from "../trainer-portal/selectors";
import "../trainer-portal/TrainerPortal.css";

// Grouped so related pages sit together: daily tasks, events, trainers, website.
const groups = [
  [["/admin", "Overview", true], ["/admin/review", "Approvals"]],
  [["/admin/learn-events", "Events & learning"], ["/admin/participants", "Participants"], ["/admin/conducted", "Completed workshops"]],
  [["/admin/contribution", "Trainer hours"]],
  [["/admin/records", "Content & records"], ["/admin/users", "Users"]],
];

export default function AdminLayout() {
  const { state, dispatch, loading, error } = useTrainer();
  if (loading) return <p role="status">Loading account...</p>;

  if (!state.adminSession) {
    return <main className="tp-page"><div className="tp-container"><AccountForm role="admin" /></div></main>;
  }

  const waiting = buildQueue(state).length;

  return (
    <main className="tp-page">
      <div className="tp-container">
        <header className="tp-head">
          <p>Signed in as <strong>{state.adminSession.name}</strong></p>
          <button className="tp-btn tp-btn-ghost" onClick={() => dispatch({ type: "ADMIN_SIGN_OUT" })}>
            Sign out
          </button>
        </header>
        <nav className="tp-menu" aria-label="Administrative Dashboard">
          {groups.map((group, i) => (
            <Fragment key={group[0][0]}>
              {i > 0 && <span className="tp-menu-sep" aria-hidden="true" />}
              {group.map(([to, label, end]) => (
                <NavLink key={to} to={to} end={end}>
                  {label}
                  {to === "/admin/review" && waiting > 0 && (
                    <span className="tp-menu-count">
                      {waiting}<span className="tp-sr"> waiting</span>
                    </span>
                  )}
                </NavLink>
              ))}
            </Fragment>
          ))}
        </nav>
        <FormFeedback>{error}</FormFeedback>
        <Outlet />
      </div>
    </main>
  );
}
