import FormFeedback from "../components/FormFeedback";
import AccountForm from "./AccountForm";
import PortalShell from "./PortalShell";
import { Outlet } from "react-router-dom";
import { useTrainer } from "./TrainerContext";
import "./TrainerPortal.css";

const groups = [
  { links: [
    { to: "/trainer-portal", label: "Dashboard", end: true, icon: "overview" },
    { to: "/trainer-portal/activities", label: "My workshops", icon: "workshops" },
    { to: "/trainer-portal/conducted", label: "Completed workshops", icon: "completed" },
    { to: "/trainer-portal/hours", label: "My hours", icon: "hours" },
    { to: "/trainer-portal/profile", label: "My profile", icon: "profile" },
  ] },
];

export default function TrainerLayout() {
  const { state, dispatch, loading, error } = useTrainer();
  if (loading) return <p role="status">Loading account...</p>;

  if (!state.session) {
    return <main className="tp-page"><div className="tp-container"><AccountForm role="trainer" /></div></main>;
  }

  return (
    <PortalShell
      eyebrow="Trainer Portal"
      title="Dementia Care Connect"
      userName={state.profile.name}
      onSignOut={() => dispatch({ type: "SIGN_OUT" })}
      groups={groups}
    >
      <FormFeedback>{error}</FormFeedback>
      <Outlet />
    </PortalShell>
  );
}