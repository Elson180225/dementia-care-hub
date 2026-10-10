# Contact page release checklist

The CONTACT draft provides channel roles but no confirmed contact values. The implementation uses Dementia Care Hub pending confirmation of Hub versus Connect.

- Confirm the public name and use it consistently across the website.
- Populate `src/data/contact.js` with approved project email, Facebook Page, Messenger, WhatsApp Community invite and RCBC contacts. Only populate the postal address after publication approval. Verify each link manually with the project administrators, including community invite access.
- Approve the short privacy notice in `src/pages/Contact.jsx`, including administrator access, retention and deletion arrangements.
- Assign an RCBC/project administrator to the enquiry inbox. This implementation routes to a private administrative file inbox, not email. Do not release until administrators have an agreed process for reviewing it.

## Running the administrative workflow

Run `npm run dev` for the website and `npm run server` for the API. Set `ENQUIRY_INBOX_DIR` to a persistent, private directory outside the public website and repository before starting the server. Without it, submissions fail safely and retain the user's input. For example, in PowerShell:

```powershell
$env:ENQUIRY_INBOX_DIR = 'C:\ProgramData\DementiaCareHub\enquiries'
$env:PUBLIC_ORIGIN = 'http://localhost:5173'
npm run server
```

Each accepted enquiry creates a JSON record with its name, reply email, enquiry type, message and timestamp. Administrators review these records through organisation-controlled filesystem access. Never serve this directory publicly. Restrict Windows folder ACLs to authorised administrators and the API service account; POSIX file modes alone do not configure Windows permissions. Agree a retention policy and delete records according to it.

For production, run one API process and reverse-proxy `/api/enquiries` to port 3001 on the same HTTPS origin as the site. Set `PUBLIC_ORIGIN` to that exact origin and use persistent backed-up inbox storage. Multiple instances require shared transactional storage and shared rate limiting. The API uses the socket IP, not untrusted forwarded headers; behind a proxy the limit is shared across visitors. Configure additional per-client rate limiting at the trusted proxy for production traffic.

Server and client share validation. The API limits body size, verifies request origin, checks a hidden spam field and minimum form-fill time, and limits requests to ten per ten minutes per socket IP. Requests are serialized, and identical enquiry contents are deduplicated for 24 hours, including retries after a lost response. These are basic spam controls; monitor abuse and add a challenge service if necessary.

## Acceptance

Run `npm test`, `npm run build` and `npm run lint`. Before release, check a real enquiry lands in the administrator's configured inbox, test unavailable storage and retry, verify mobile layout and keyboard navigation, and confirm all published official links with their owners. Event registrations remain on Education & Events; external services link to Find Help & Support.
