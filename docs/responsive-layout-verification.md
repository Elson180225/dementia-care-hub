# Responsive layout verification

The responsive stylesheet is loaded after component styles so older desktop grid declarations do not override phone/tablet breakpoints. Desktop content and workflows are preserved.

## Improvements
- Event/resource/topic grids: one column at 650px and below, two columns through 1024px, existing desktop layout above.
- Event type/status/price badges wrap; long text, form options and filenames cannot expand their containers.
- Phone/tablet navigation remains reachable at the top of a page and scrolls inside available viewport height. The toggle exposes its controlled navigation, announces open/close, and Escape closes it and restores focus.
- Dialogs use dynamic viewport height, scroll padding and stacked mobile actions. Inputs keep a readable size and scroll margins for smaller viewports.
- Admin filters and actions wrap; trainer editor and preview panels stack; participant summaries collapse to one column.
- Admin tables retain table semantics and scroll inside their wrappers. Hidden accessibility labels are positioned within those regions instead of causing page overflow.
- Narrow portal menus scroll horizontally inside their own region. The body is not globally clipped to disguise layout defects.

## Browser checks
Performed in a local browser with explicit viewport overrides:
- 320, 375 and 390px phones; 768 and 1024px tablets; 1440px desktop.
- Public Online Education, Physical Education, Events/roadmap/outreach, calendar and trainer directory.
- At 375px: Understanding Dementia, Find Help, Caregiver Support, Contact and Get Updated.
- Authenticated admin overview, event list, participant list, registration review, trainer editor and translation workspace.
- Navigation open/close and Escape behaviour; event details and registration dialogs (no submissions sent).

The authenticated checks used a disposable PostgreSQL schema and temporary fake accounts/participants, separate from the working database. Emails and reminder workers were disabled. No actual registration, payment, deletion or approval actions were performed.

Checks compare document scroll width against its visible width; table/carousel scrolling remains intentional. Public cards were also checked for their actual column count, because clipped cards can hide an incorrect grid even when the document itself does not overflow.

These are browser viewport checks, not physical-device certification. Final client acceptance should include an actual iPhone/Android browser, screen rotation, keyboard opening and 200% text zoom.
