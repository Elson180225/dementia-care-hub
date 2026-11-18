export const emailInventory = [
  {
    name: 'Contact enquiry notification',
    trigger: 'A visitor submits the contact form. The notification queue is checked every minute.',
    recipient: 'The RCBC mailbox configured as ENQUIRY_ADMIN_EMAIL.',
    action: 'Review the enquiry, reply to the visitor and record follow-up and closure in Enquiries.',
    off: 'Clear ENQUIRY_ADMIN_EMAIL and restart the API. Saved enquiries are available in Content & records > Enquiries.',
  },
  {
    name: 'Automatic activity reminder',
    trigger: 'An eligible published activity enters the configured reminder window, normally 24 hours before it starts.',
    recipient: 'Opted-in Get Updated subscribers matching language and locality, subject to opt-outs and provider suppression.',
    action: 'Read the activity details and register if interested.',
    off: 'Set REMINDERS_ENABLED=false and restart the API. Recipients can also use the unsubscribe link.',
  },
  {
    name: 'Participant reminder',
    trigger: 'An admin selects participants, reviews the message and chooses Confirm and send.',
    recipient: 'Selected active participants for that event. When managed registration is enabled, their registrations must be confirmed.',
    action: 'Read the joining details and follow the event instructions.',
    off: 'Stop using Confirm and send in Participants. These reminders require an explicit admin action.',
  },
  {
    name: 'Registration confirmation',
    trigger: 'An admin explicitly chooses Send confirmation for a confirmed registration. Paid registrations require verified payment.',
    recipient: 'The active confirmed participant for that event.',
    action: 'Check the confirmed event date, venue and registration details.',
    off: 'Stop using Send confirmation in Registration review. Confirming a registration alone sends no email.',
  },
  {
    name: 'Brevo campaigns managed by RCBC',
    trigger: 'RCBC separately sends or schedules a campaign in Brevo after exporting or syncing its audience.',
    recipient: 'The audience selected by RCBC in Brevo.',
    action: 'Follow the action requested in the campaign.',
    off: 'Pause campaigns and automations in Brevo. Reconcile current opt-outs before sending again.',
  },
];
