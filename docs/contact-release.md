# Contact page release checklist

The public page uses Dementia Care Connect. All project and organiser contact options remain visible. Options without an approved destination show a confirmation notice and direct visitors to the enquiry form. They are not clickable until configured.

- Populate `src/data/contact.js` with approved project email, Facebook Page, Messenger, WhatsApp Community invite and RCBC contacts. Verify each destination with RCBC. Publish a postal address only after approval.
- Ask RCBC to approve public wording, translated notices and privacy/retention arrangements.
- Run `npm run db:migrate` before starting the updated API.
- Set `ENQUIRY_ADMIN_EMAIL` to the designated RCBC recipient. Configure `BREVO_API_KEY`, verified `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` and `APP_BASE_URL`.
- Run `npm run dev` and `npm run server`. Set `PUBLIC_ORIGIN` to the website origin. For production, reverse-proxy `/api` to the API on the same HTTPS origin.

## Enquiry workflow

Accepted enquiries are saved in PostgreSQL and appear in Admin > Content & records > Enquiries. The notification worker checks queued enquiries every minute and emails the designated RCBC recipient when configured. A form success confirms storage, not email delivery. Administrators can inspect notification status even when delivery fails.

Choose Record follow-up, reply using the visitor email link, record the action/outcome, and select In progress or Closed. Follow-up notes, status history and timestamps demonstrate handling and closure. Saving a note does not automatically send a reply to the visitor.

Confirmed failed notifications can be retried by an admin. Uncertain outcomes require checking Brevo logs before manual recovery to avoid duplicate messages. Email delivery is not enabled until the recipient and provider settings are configured. The optional file inbox in the standalone handler is not the running API's production workflow.

## Acceptance

Run `npm test`, `npm run build` and `npm run lint`. Use an authorized test recipient to demonstrate one saved enquiry, its email notification, recorded follow-up and closure. Check mobile layout, keyboard navigation and all supported languages. Verify unavailable options remain visible without empty links. Confirm all official destinations with their owners.

See [About and Contact workflow](about-contact-workflow.md) for content approval, setup and acceptance details.

## Branded notification email

Enquiry notifications include the RCBC Alzheimer?s Care logo, Rotary emblem, enquiry details, the original visitor message and a link to the admin portal. HTML and plain-text versions are provided. Visitor wording is preserved exactly; only the surrounding template copy is edited.

The logo files are served from `/email/` in the public website. In production, set APP_BASE_URL to the public HTTPS website origin. For local development, optionally set EMAIL_ASSET_BASE_URL to a public HTTPS origin where the same `/email/` files have been deployed. Gmail cannot retrieve images from localhost. Recipients may need to enable image display. This changes the email body, not the sender profile picture. Restart the API after updating the template or environment. Existing sent emails are unchanged.
