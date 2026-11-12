import { NavLink } from "react-router-dom";
import PortalIcon from "./PortalIcon";

// Shared sidebar layout for the Admin Dashboard and Trainer Portal.
export default function PortalShell({ eyebrow, title, userName, onSignOut, groups, children }) {
  return (
    <div className="tp-page tp-shell">
      <aside className="tp-sidebar">
        <div className="tp-sidebar-brand">
          <span className="tp-sidebar-eyebrow">{eyebrow}</span>
          <strong>{title}</strong>
        </div>

        <nav className="tp-sidebar-nav" aria-label={eyebrow}>
          {groups.map((group) => (
            <div className="tp-sidebar-group" key={group.label || group.links[0].to}>
              {group.label && <span className="tp-sidebar-label">{group.label}</span>}
              {group.links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end}>
                  <PortalIcon name={link.icon} />
                  <span className="tp-sidebar-text">{link.label}</span>
                  {link.count > 0 && (
                    <span className="tp-menu-count">
                      {link.count}<span className="tp-sr"> waiting</span>
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="tp-sidebar-user">
          <span>Signed in as</span>
          <strong>{userName}</strong>
          <button type="button" className="tp-sidebar-signout" onClick={onSignOut}>
            <PortalIcon name="signout" /> Sign out
          </button>
        </div>
      </aside>

      <main className="tp-main">{children}</main>
    </div>
  );
}