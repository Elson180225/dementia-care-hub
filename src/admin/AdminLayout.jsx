import FormFeedback from "../components/FormFeedback";
import AccountForm from "../trainer-portal/AccountForm";
import PortalShell from "../trainer-portal/PortalShell";
import { Outlet } from "react-router-dom";
import { useTrainer } from "../trainer-portal/TrainerContext";
import { buildQueue } from "../trainer-portal/selectors";
import "../trainer-portal/TrainerPortal.css";

export default function AdminLayout() {
  const { state, dispatch, loading, error } = useTrainer();
  if (loading) return <p role="status">Loading account...</p>;

  if (!state.adminSession) {
    return <main className="tp-page"><div className="tp-container"><AccountForm role="admin" /></div></main>;
  }

  const waiting = buildQueue(state).length;

  // Grouped so related pages sit together: daily tasks, events, trainers, website.
  const groups = [
    { label: "Daily", links: [
      { to: "/admin", label: "Overview", end: true, icon: "overview" },
      { to: "/admin/review", label: "Approvals", icon: "approvals", count: waiting },
    ] },
    { label: "Events", links: [
      { to: "/admin/learn-events", label: "Events & learning", icon: "events" },
      { to: "/admin/participants", label: "Event registrations & participants", icon: "participants" },
      { to: "/admin/conducted", label: "Completed workshops", icon: "completed" },
    ] },
    { label: "Trainers & access", links: [
      { to: "/admin/contribution", label: "Trainer hours", icon: "hours" },
      { to: "/admin/users", label: "Users", icon: "users" },
    ] },
    { label: "Website", links: [
      { to: "/admin/translations", label: "Language & translations", icon: "content" },
      { to: "/admin/records", label: "Content & records", icon: "content" },
    ] },
  ];

  return (
    <PortalShell
      eyebrow="RCBC Admin"
      title="Dementia Care Connect"
      userName={state.adminSession.name}
      onSignOut={() => dispatch({ type: "ADMIN_SIGN_OUT" })}
      groups={groups}
    >
      <FormFeedback>{error}</FormFeedback>
      <Outlet />
    </PortalShell>
  );
}
