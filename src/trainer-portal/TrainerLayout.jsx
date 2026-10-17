import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTrainer } from "./TrainerContext";
import "../admin/Admin.css";
const links = [
  ["/trainer-portal", "Dashboard", true],
  ["/trainer-portal/profile", "My Profile"],
  ["/trainer-portal/activities", "Workshop & Seminar"],
  ["/trainer-portal/conducted", "Conducted"],
  ["/trainer-portal/hours", "Contribution & Hours"],
];
export default function TrainerLayout() {
  const auth = useAuth(),
    { state, loading, error, refresh } = useTrainer();
  if (auth.loading) return <main className="ad-page">Checking session…</main>;
  if (!auth.user) return <Navigate to="/login" replace />;
  if (auth.user.role === "admin") return <Navigate to="/admin" replace />;
  return (
    <main className="ad-page">
      <div className="ad-heading">
        <div>
          <span className="ad-eyebrow">CERTIFIED TRAINER PORTAL</span>
          <h1>Welcome, {auth.user.name}</h1>
        </div>
        <button
          className="ad-secondary"
          onClick={() => auth.logout().catch((e) => alert(e.message))}
        >
          Log out
        </button>
      </div>
      <nav className="ad-actions" aria-label="Trainer Portal">
        {links.map(([to, label, end]) => (
          <NavLink
            style={({ isActive }) => ({
              fontWeight: isActive ? 700 : 400,
              padding: "9px 12px",
              borderBottom: isActive
                ? "2px solid #51277d"
                : "2px solid transparent",
            })}
            key={to}
            to={to}
            end={end}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      {error ? (
        <p className="ad-error" role="alert">
          {error} <button onClick={refresh}>Retry</button>
        </p>
      ) : loading || !state.profile ? (
        <p role="status">Loading your records…</p>
      ) : (
        <Outlet />
      )}
    </main>
  );
}
