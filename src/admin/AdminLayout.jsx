import { NavLink, Outlet } from "react-router-dom";
import { useTrainer } from "../trainer-portal/TrainerContext";
import "../trainer-portal/TrainerPortal.css";

function AdminSignIn() {
  const { dispatch } = useTrainer();
  return (
    <section className="tp-card">
      <h1>RCBC Administrative Dashboard</h1>
      <p>For authorised RCBC administrators only. Administrator accounts are created internally by RCBC, so there is no sign-up.</p>
      <p className="tp-dev">
        Development placeholder: this button gives no real security. The real sign-in will be
        checked on the server.
      </p>
      <button className="tp-btn" onClick={() => dispatch({ type: "ADMIN_SIGN_IN" })}>
        Continue as sample admin
      </button>
    </section>
  );
}

const links = [
  ["/admin", "Overview", true],
  ["/admin/review", "Review queue"],
  ["/admin/contribution", "Trainer contribution"],
];

export default function AdminLayout() {
  const { state, dispatch } = useTrainer();

  if (!state.adminSession) {
    return <main className="tp-page"><div className="tp-container"><AdminSignIn /></div></main>;
  }

  return (
    <main className="tp-page">
      <div className="tp-container">
        <header className="tp-head">
          <p>Signed in as <strong>{state.adminSession.name}</strong></p>
          <button className="tp-btn tp-btn-ghost" onClick={() => dispatch({ type: "ADMIN_SIGN_OUT" })}>
            Sign out
          </button>
        </header>
        <nav className="tp-nav" aria-label="Administrative Dashboard">
          {links.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}>{label}</NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </main>
  );
}