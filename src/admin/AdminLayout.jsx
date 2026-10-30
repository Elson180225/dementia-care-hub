import AccountForm from "../trainer-portal/AccountForm";
import { NavLink, Outlet } from "react-router-dom";
import { useTrainer } from "../trainer-portal/TrainerContext";
import "../trainer-portal/TrainerPortal.css";

const links = [
  ["/admin", "Overview", true],
  ["/admin/learn-events", "Learn & Events Hub"],
  ["/admin/participants", "Workshop participants"],
  ["/admin/review", "Review queue"],
  ["/admin/contribution", "Trainer contribution"],
  ["/admin/conducted", "Completion records"],
  ["/admin/records", "Content and records"],
  ["/admin/users", "Users and access"],
];

export default function AdminLayout() {
  const { state, dispatch, loading } = useTrainer();
  if (loading) return <p role="status">Loading account...</p>;

  if (!state.adminSession) {
    return <main className="tp-page"><div className="tp-container"><AccountForm role="admin" /></div></main>;
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
