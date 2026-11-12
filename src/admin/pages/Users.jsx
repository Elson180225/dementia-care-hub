import { useState } from 'react';
import { api, useTrainer } from '../../trainer-portal/TrainerContext';

const CERT_LABEL = { pending: 'Waiting for approval', certified: 'Certified', suspended: 'Suspended' };
const LISTING_LABEL = { none: 'Not listed', requested: 'Listing requested', approved: 'Publicly listed', returned: 'Listing returned', rejected: 'Listing not approved', suspended: 'Listing suspended' };

export default function Users() {
  const { state, refresh } = useTrainer();
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');

  const admins = state.users.filter((u) => u.role === 'admin');
  const trainers = state.users.filter((u) => u.role === 'trainer');

  async function run(task, done) {
    setBusy(true);
    try { await task(); await refresh(); setEditing(null); setMessage(done); }
    catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  function save(e) {
    e.preventDefault();
    run(() => api('/api/admin/users', editing), 'Trainer account updated. Revoked access takes effect immediately.');
  }

  async function invite(e) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email');
    setBusy(true);
    try {
      const r = await api('/api/admin/invitations', { email });
      setLink(r.link);
      setMessage("Invitation link created. Send it to the new admin through RCBC's usual channel. It expires in 24 hours.");
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  function changeListing(listing) {
    const comment = listing === 'suspended' ? window.prompt('Reason for suspending this listing (the trainer will see it):') : '';
    if (listing === 'suspended' && !comment?.trim()) return;
    run(() => api('/api/portal/actions', { type: 'ADMIN_LISTING', id: editing.id, listing, comment }),
      listing === 'suspended' ? 'Listing suspended. The trainer is no longer shown publicly.' : 'Listing restored.');
  }

  return (
    <>
      <h1>Users</h1>
      {message && <p className="tp-note" role="status">{message}</p>}

      <section className="tp-card">
        <h2>RCBC admins</h2>
        <form className="tp-toolbar" onSubmit={invite}>
          <label className="tp-field" style={{ flex: 1 }}>Invite a new admin by email
            <input name="email" type="email" required placeholder="name@example.com" />
          </label>
          <button className="tp-btn" disabled={busy}>Create invitation link</button>
        </form>
        {link && <p>Invitation link: <a href={link}>{link}</a></p>}
        <div className="tp-table-wrap">
          <table className="tp-table">
            <thead><tr><th>Name</th><th>Email</th><th>Sign-in</th></tr></thead>
            <tbody>
              {admins.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    {u.id === state.adminSession?.id && <span className="tp-chip tp-chip-grey" style={{ marginLeft: 8 }}>You</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.enabled ? 'Can sign in' : 'Access turned off'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tp-dev">Admin accounts can't be changed from this page.</p>
      </section>

      <section className="tp-card">
        <h2>Trainers</h2>
        <div className="tp-table-wrap">
          <table className="tp-table">
            <thead><tr><th>Name</th><th>Email</th><th>Certification</th><th>Public listing</th><th>Sign-in</th><th>Actions</th></tr></thead>
            <tbody>
              {trainers.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{CERT_LABEL[u.certified_status] ?? 'Waiting for approval'}</td>
                  <td>{LISTING_LABEL[u.listing_status] ?? 'Not listed'}</td>
                  <td>{u.enabled ? 'Can sign in' : 'Access turned off'}</td>
                  <td>
                    <button className="tp-btn tp-btn-ghost" style={{ minHeight: 36, padding: '4px 12px' }}
                      onClick={() => setEditing({ ...u, certifiedStatus: u.certified_status || 'pending', certificateRef: u.certificate_ref || '', comment: '' })}>
                      Manage access
                    </button>
                  </td>
                </tr>
              ))}
              {trainers.length === 0 && <tr><td colSpan="6">No trainer accounts yet.</td></tr>}
            </tbody>
          </table>
        </div>

        {editing && (
          <form className="tp-card" onSubmit={save}>
            <h2>Manage access: {editing.name}</h2>
            <label className="tp-field"><span>Can sign in</span>
              <input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} />
            </label>
            <label className="tp-field">Certification
              <select value={editing.certifiedStatus} onChange={(e) => setEditing({ ...editing, certifiedStatus: e.target.value })}>
                {Object.entries(CERT_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="tp-field">Official certificate reference
              <input value={editing.certificateRef} onChange={(e) => setEditing({ ...editing, certificateRef: e.target.value })} />
            </label>
            <label className="tp-field">Note (optional)
              <textarea value={editing.comment} onChange={(e) => setEditing({ ...editing, comment: e.target.value })} />
            </label>
            <div className="tp-actions">
              <button className="tp-btn" disabled={busy}>Save</button>
              {editing.listing_status === 'approved' && (
                <button type="button" className="tp-btn tp-btn-ghost" disabled={busy} onClick={() => changeListing('suspended')}>Suspend public listing</button>
              )}
              {editing.listing_status === 'suspended' && (
                <button type="button" className="tp-btn tp-btn-ghost" disabled={busy} onClick={() => changeListing('approved')}>Restore public listing</button>
              )}
              <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}