import FormFeedback from "../components/FormFeedback";
import AccountForm from "./AccountForm";
import PortalShell from "./PortalShell";
import { Outlet } from "react-router-dom";
import { useTrainer } from "./TrainerContext";
import {useEffect,useState} from 'react';
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
  const [reviewer,setReviewer]=useState(false);
  useEffect(()=>{let active=true;if(!state.session)return;fetch('/api/admin/translations?access=1').then(r=>r.ok?r.json():null).then(data=>{if(active)setReviewer(!!data?.actor?.scopes?.length);}).catch(()=>{});return()=>{active=false;};},[state.session]);
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
      groups={reviewer?[...groups,{links:[{to:'/trainer-portal/translations',label:'Translation reviews',icon:'content'}]}]:groups}
    >
      <FormFeedback>{error}</FormFeedback>
      <Outlet />
    </PortalShell>
  );
}
