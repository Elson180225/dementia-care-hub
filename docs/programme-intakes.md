# Programme overviews and dated registrations

Physical Education edits programme information and offers a live content preview. A programme is an overview, not a booking. Legacy general applications remain available as a read-only archive; they are not converted automatically into confirmed event registrations.

## Setup

### Refined CMS navigation

### Participant programme groups and date checks

Event registrations & participants now begins with highlighted programme cards. Select a programme, then Open participants on one dated intake. The selected programme, title and Malaysia date/time remain visible. Existing direct links using ?activity= still select the appropriate group after records load. Webinars & other events retains standalone and unlinked records, including records whose old programme no longer exists. Grouping uses programme_id, never title matching.

The participant list API includes programme links and event metadata. Restart the backend after this change. No database migration is added in this refinement; the earlier programme link migration 019 is still required.

Public intake details, general event details, participant event headings and reminder date text use explicit Malaysia date/time formatting. A UTC deadline of 2027-02-04T16:00:00.000Z displays as 5 February 2027, 12:00 am (Malaysia time). Stored timestamps and the editor's existing Malaysia-to-database conversion are unchanged.

Manual checks: choose each programme; verify only linked intakes appear; open a historical unlinked webinar; open a direct participant link; switch groups and verify the previous intake is cleared; check a midnight UTC rollover deadline and a morning intake against their saved editor values. Participant imports, payment review, confirmations and History must continue to operate on the selected activity ID.

Open Physical Education to see programme cards. Edit programme manages its overview, audience, learning highlights, general format and availability, with a live preview. Manage intakes opens only that programme's sessions. Add intake automatically supplies and locks its programme link, defaults to Physical / paid in-person, and keeps registration closed until configured. Each intake editor has a summary preview. Use View participants on the intake to open the existing participant page with that intake selected.

Existing unlinked sessions remain under Other physical events and existing unlinked intakes. Edit them there to select their programme; do not recreate them. Previously entered programme schedule notes remain in a collapsed reference section. They no longer appear as confirmed public dates.

Planned programmes are enquiries-only on the public programme page. The Care Worker programme defaults to planned unless RCBC explicitly changes its availability. Website registration is blocked for planned programmes, including when opened through the calendar. RCBC should also close any independently managed external forms. Existing records remain available to admin. No existing registrations are deleted.

Public visitors read the programme, choose an upcoming intake, view its details and use the configured website or external registration route. Past intakes appear in a separate expandable archive, newest first. The calendar and programme page use the same dated activity record.

Check that Save as Draft hides a new intake, publication exposes it, and switching between programmes shows only their linked intakes. Confirm planned programme availability and legacy schedule preservation before RCBC acceptance.

1. Run `npm run db:migrate`, then restart the API. Migration 019 adds the optional programme link on dated activities. No existing participant or application records are deleted.
2. In event management, create or edit a dated Physical event. As admin, select its Physical Education programme, configure fees and registration method, then save and publish it.
3. Existing events require an explicit programme selection. Matching names alone never links events or moves participants.
4. Configure Google Form registration with its external URL, or choose website registration. Open registration when ready. Paid programmes still require payment verification and admin confirmation.
5. Use Event registrations & participants for records, import, review, confirmation, reminders, export and removed-participant History.

## Manual checks

- Link two future published events to DCS-Family and another to DCS-TTT. Each programme must show only its own future intakes, earliest first.
- Draft, cancelled and past events must not appear as available intakes. Without an upcoming intake, show the contact message.
- Open an intake: verify its dates, fee and selected registration route. Submit through the website, or use the configured Google Form and import its responses. Check the record under the same dated event.
- For paid registration, verify submission is not confirmation. Review payment, confirm the registration, then send its confirmation. Free events bypass payment verification.
- Check removal confirmation and History restoration preserve payment and registration information.
- Open Physical Education's legacy archive. Existing records remain readable, with no status-changing control. Old public application requests return HTTP 410 rather than creating a second registration.
- Confirm programme preview displays “View available intakes” and editing programme copy does not change dated participant records.

Database integration and browser checks require a configured local database; build and unit checks alone do not verify the live workflow.
