import { NavLink, Outlet } from "react-router-dom";
import { useTrainer } from "./TrainerContext";
import "./TrainerPortal.css";

function SignIn() {
  const { dispatch } = useTrainer();
  return (
    <section className="tp-card">
      <h1>Certified Trainer Portal</h1>
      <p>For verified Certified Trainers only. Access is given after RCBC verifies your identity and certificate.</p>
      <p className="tp-dev">
        Development placeholder: this button gives no real security. The real sign-in
        (SCRUM-68) will be checked on the server.
      </p>
      <button className="tp-btn" onClick={() => dispatch({ type: "SIGN_IN" })}>
        Continue as sample trainer
      </button>
    </section>
  );
}

const links = [
  ["/trainer-portal", "Dashboard", true],
  ["/trainer-portal/profile", "My Profile"],
  ["/trainer-portal/activities", "Workshop & Seminar"],
  ["/trainer-portal/conducted", "Conducted"],
  ["/trainer-portal/hours", "Contribution & Hours"],
];

export default function TrainerLayout() {
  const { state, dispatch } = useTrainer();

  if (!state.session) {
    return <main className="tp-page"><div className="tp-container"><SignIn /></div></main>;
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
        <nav className="tp-nav" aria-label="Trainer Portal">
          {links.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}>{label}</NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </main>
  );
}