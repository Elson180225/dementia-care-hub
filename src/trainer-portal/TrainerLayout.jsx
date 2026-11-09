import FormFeedback from "../components/FormFeedback";
import AccountForm from "./AccountForm";
import { NavLink, Outlet } from "react-router-dom";
import { useTrainer } from "./TrainerContext";
import "./TrainerPortal.css";

const links = [
  ["/trainer-portal", "Dashboard", true],
  ["/trainer-portal/profile", "My profile"],
  ["/trainer-portal/activities", "My workshops"],
  ["/trainer-portal/conducted", "Completed workshops"],
  ["/trainer-portal/hours", "My hours"],
];

export default function TrainerLayout() {
  const { state, dispatch, loading, error } = useTrainer();
  if (loading) return <p role="status">Loading account...</p>;

  if (!state.session) {
    return <main className="tp-page"><div className="tp-container"><AccountForm role="trainer" /></div></main>;
  }

  return (
    <main className="tp-page">
      <div className="tp-container">
        <header className="tp-head">
          <p>Signed in as <strong>{state.profile.name}</strong></p>
          <button className="tp-btn tp-btn-ghost" onClick={() => dispatch({ type: "SIGN_OUT" })}>
            Sign out
          </button>
        </header>
        <nav className="tp-menu" aria-label="Trainer Portal">
          {links.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}>{label}</NavLink>
          ))}
        </nav>
        <FormFeedback>{error}</FormFeedback>
        <Outlet />
      </div>
    </main>
  );
}