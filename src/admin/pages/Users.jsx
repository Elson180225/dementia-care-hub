import { Field } from '../../trainer-portal/ui';
import UploadField from '../../trainer-portal/UploadField';
import { useState } from 'react';
import { api, useTrainer } from '../../trainer-portal/TrainerContext';
import { ASSESSMENT_LABEL, teachingEligibility } from '../../../shared/teaching-eligibility';

const CERT_LABEL = { pending: 'Waiting for approval', certified: 'Certified', suspended: 'Suspended' };
const LISTING_LABEL = { none: 'Not listed', requested: 'Listing requested', approved: 'Publicly listed', returned: 'Listing returned', rejected: 'Listing not approved', suspended: 'Listing suspended' };

export default function Users() {
  const { state, refresh } = useTrainer();
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
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
          <Field id="invite-email" label="Invite a new admin by email"><input id="invite-email" name="email" type="email" required placeholder="name@example.com" /></Field>
          <button className="tp-btn" disabled={busy || uploading}>Create invitation link</button>
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
            <thead><tr><th>Name</th><th>Email</th><th>Certification</th><th>Assessment</th><th>HCP</th><th>Teaching eligibility</th><th>Public listing</th><th>Sign-in</th><th>Actions</th></tr></thead>
            <tbody>
              {trainers.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{CERT_LABEL[u.certified_status] ?? 'Waiting for approval'}</td>
                  <td>{ASSESSMENT_LABEL[u.assessment_status] ?? 'Not assessed yet'}</td>
                  <td>{u.healthcare_professional == null ? 'Not recorded' : u.healthcare_professional ? 'Yes' : 'No'}</td>
                  <td>{teachingEligibility(u.assessment_status, u.healthcare_professional)}</td>
                  <td>{LISTING_LABEL[u.listing_status] ?? 'Not listed'}</td>
                  <td>{u.enabled ? 'Can sign in' : 'Access turned off'}</td>
                  <td>
                    <button className="tp-btn tp-btn-ghost" style={{ minHeight: 36, padding: '4px 12px' }}
                      disabled={busy || uploading} onClick={() => setEditing({ ...u, certifiedStatus: u.certified_status || 'pending', certificateRef: u.certificate_ref || '', assessmentResult: u.assessment_result || '', assessmentStatus: u.assessment_status || 'not_assessed',  healthcareProfessional: u.healthcare_professional ?? null, independentTeachingScope: u.independent_teaching_scope || '', certificateEvidenceUrl: u.certificate_file_id ? '/api/files/'+u.certificate_file_id : '', comment: '' })}>
                      Manage access
                    </button>
                  </td>
                </tr>
              ))}
              {trainers.length === 0 && <tr><td colSpan="9">No trainer accounts yet.</td></tr>}
            </tbody>
          </table>
        </div>

        {editing && (
          <form className="tp-card" onSubmit={save}>
            <h2>Manage access: {editing.name}</h2>
            <Field id="user-enabled" label="Can sign in" example="Account access and public listing approval are separate decisions.">
              <input id="user-enabled" type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} />
            </Field>
            <Field id="user-certification" label="Certification" required example="Choose the certification status verified by RCBC."><select id="user-certification" value={editing.certifiedStatus} onChange={(e) => setEditing({ ...editing, certifiedStatus: e.target.value })}>
                {Object.entries(CERT_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select></Field>
            <Field id="user-certificate-ref" label="Official certificate reference" required={editing.certifiedStatus==='certified'} example="Enter the reference exactly as recorded by RCBC. Required for certified trainers."><input required={editing.certifiedStatus==='certified'} id="user-certificate-ref" value={editing.certificateRef} onChange={(e) => setEditing({ ...editing, certificateRef: e.target.value })} /></Field>
            <UploadField label="Certificate image or PDF (private, optional)" kind="document" value={editing.certificateEvidenceUrl} onChange={certificateEvidenceUrl=>setEditing({...editing,certificateEvidenceUrl})} onBusyChange={setUploading} disabled={busy || uploading} help="Attach a certificate matching the reference. Certificate evidence remains private and does not approve access or listing automatically."/>
                        <Field id="user-assessment-status" label="Assessment status" required example="Choose the assessment outcome confirmed in RCBC's TTT records.">
              <select id="user-assessment-status" value={editing.assessmentStatus} onChange={(e) => setEditing({ ...editing, assessmentStatus: e.target.value })}>
                {Object.entries(ASSESSMENT_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field id="user-assessment-result" label="Assessment result" example="Record the RCBC-confirmed outcome, for example: Passed practical assessment. Leave blank until assessed."><textarea id="user-assessment-result" value={editing.assessmentResult} onChange={e=>setEditing({...editing,assessmentResult:e.target.value})}/></Field>
            <Field id="user-healthcare-professional" label="Healthcare professional" example="Choose Yes or No based on confirmed information. Choose Not recorded if unknown."><select id="user-healthcare-professional" value={editing.healthcareProfessional===null?'unknown':String(editing.healthcareProfessional)} onChange={e=>setEditing({...editing,healthcareProfessional:e.target.value==='unknown'?null:e.target.value==='true'})}><option value="unknown">Not recorded</option><option value="true">Yes</option><option value="false">No</option></select></Field>
                <p className="tp-note">Teaching eligibility: <strong>{teachingEligibility(editing.assessmentStatus, editing.healthcareProfessional)}</strong></p>
            <Field id="user-teaching-scope" label="Approved scope for independent teaching" example="Record what RCBC permits the trainer to teach independently, for example: DCS-Family education."><textarea id="user-teaching-scope" value={editing.independentTeachingScope} onChange={e=>setEditing({...editing,independentTeachingScope:e.target.value})}/></Field>
            <p>Public listing consent: {editing.listing_consent_at ? new Date(editing.listing_consent_at).toLocaleDateString('en-MY') : 'Not given'}. Listing requests are reviewed separately in Approvals.</p>
            <Field id="user-note" label="Note (optional)"><textarea id="user-note" value={editing.comment} onChange={(e) => setEditing({ ...editing, comment: e.target.value })} /></Field>
            <div className="tp-actions">
              <button className="tp-btn" disabled={busy || uploading}>Save</button>
              {editing.listing_status === 'approved' && (
                <button type="button" className="tp-btn tp-btn-ghost" disabled={busy || uploading} onClick={() => changeListing('suspended')}>Suspend public listing</button>
              )}
              {editing.listing_status === 'suspended' && (
                <button type="button" className="tp-btn tp-btn-ghost" disabled={busy || uploading} onClick={() => changeListing('approved')}>Restore public listing</button>
              )}
              <button type="button" className="tp-btn tp-btn-ghost" disabled={busy || uploading} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}