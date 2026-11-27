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

  // Grouped as RCBC's Admin Portal Draft 02 (section 24, Final Working Structure).
  const groups = [
    { label: "Overview & approvals", links: [
      { to: "/admin", label: "Overview", end: true, icon: "overview" },
      { to: "/admin/review", label: "Approvals", icon: "approvals", count: waiting },
    ] },
    { label: "Content & resources", links: [
      { to: "/admin/records", label: "Content & Resources", icon: "content" },
      { to: "/admin/translations", label: "Language & Translations", icon: "content" },
    ] },
    { label: "Directory", links: [
      { to: "/admin/directory", label: "Directory Management", icon: "content" },
    ] },
    { label: "Education & events", links: [
      { to: "/admin/learn-events", label: "Education & Events", icon: "events" },
      { to: "/admin/participants", label: "Registrations & Participants", icon: "participants" },
      { to: "/admin/conducted", label: "Completed Activities", icon: "completed" },
    ] },
    { label: "Training & trainers", links: [
      { to: "/admin/trainers", label: "Trainer Management", icon: "users" },
    ] },
    { label: "Community & communication", links: [
      { to: "/admin/enquiries-subscribers", label: "Enquiries & Subscribers", icon: "content" },
    ] },
    { label: "Reports & records", links: [
      { to: "/admin/contribution", label: "Trainer Hours & Reports", icon: "hours" },
    ] },
    { label: "Administration & security", links: [
      { to: "/admin/users", label: "Users & Access", icon: "users" },
    ] },
  ];

  return (
    <PortalShell
      eyebrow="RCBC Admin Portal"
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