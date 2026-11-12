// Small line icons for the portal sidebar menu.
const PATHS = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  approvals: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  events: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  participants: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.7-3.4 2.9-5.5 5.5-5.5s4.8 2.1 5.5 5.5" /><circle cx="17" cy="9" r="2.3" /><path d="M15.8 13.7c2.3.2 3.9 2 4.7 5.3" /></>,
  completed: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="m9 13 2 2 4-4" /></>,
  hours: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  content: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  users: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8M16 7l2 2M14 9l2 2" /></>,
  profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.8 3.6-6 7-6s6.2 2.2 7 6" /></>,
  workshops: <><rect x="4" y="3.5" width="16" height="10" rx="1.5" /><path d="M8 21l2-7.5M16 21l-2-7.5M8 7.5h8M8 10h5" /></>,
  signout: <><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /><path d="M15 16l4-4-4-4M19 12H9" /></>,
};

export default function PortalIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}