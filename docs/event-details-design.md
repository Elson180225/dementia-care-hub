# Event details and registration presentation

## Separate registration window

Complete registration form now opens a separate registration dialog above the event details. It shows the event name, fee/instructions and the existing registration form. Closing the form returns to the event details and restores focus to its launch button. Entered contact fields and consent are retained while the event detail view remains open; they are not persisted after leaving the event.

The underlying event dialog is temporarily inert and hidden from assistive technology while the registration dialog is open. Escape closes only the form. Close/backdrop actions are blocked during submission. Duplicate, shared-phone and success notices are displayed inside the registration window. Success can be reopened from View submission status.

The lavender poster-column background now fills the full event-detail column instead of ending at the poster caption. The sticky poster and mobile stacking remain.

Browser checks confirmed separate form opening, Escape returning to details, focus restoration, retained test name on reopening, and the full-height column colour. No live registration was submitted.

The shared event detail dialog now uses a wider desktop layout with the poster on the left and the title, metadata, description and registration on the right. The poster is not cropped and can be opened at full size. Missing posters have a neutral information placeholder. On smaller screens the columns stack; on narrow phones the facts and form fields become a single column.

The close toolbar stays visible. Escape closes the dialog, focus stays within its visible controls while open, and closing restores focus to the event button. Registration options show a loading state before legacy fallback links appear, with retry/contact actions for request failures.

The registration card separates fee, payment guidance, instructions, contact fields and consent. It supports the existing website/Google Form settings. Opening the website form focuses the first field; hiding and reopening it retains entered details. Duplicate/shared-phone notices, consent validation, paid verification requirements and backend submission behavior remain in place.

The calendar's compact detail panel also offers Open full event details & registration, using the same dialog.

Verification: production build; registration, duplicate and date tests; desktop browser inspection of an existing DCS intake, poster, form expansion, visible first-field focus, Escape and focus restoration. No live registration was submitted during the visual check. Mobile stacking is implemented in CSS and should be included in RCBC's device acceptance testing.
