# Translation review and English fallback

## Simplified page-based workspace

The opening screen uses familiar website page cards rather than storage references. Each card reports separate Bahasa Malaysia and Chinese progress. Choose Translate content, Review translations, or English content changed, then open a page and select a heading/paragraph.

Everyday editing has two actions: Save for later and Save & send for review. The latter saves new edits before submitting, so admins do not have to manage separate save/submit steps. Public preview explains whether visitors currently receive English or the previously approved translation. Draft preview remains separate.

Review translations shows waiting work. Experts see only their expertise categories; RCBC publication controls appear after required expert review. Request corrections requires a comment. Expert access, content references, individual review exceptions and history are collapsed away from everyday editing.

Send saved page drafts for review submits up to 500 current saved drafts for the chosen page and language in one transaction. It never submits unsaved edits, missing translations, outdated source versions or already published items, and does not publish anything. Each section retains separate approval/correction controls.

Page review settings provide an occasional setup step. A page requirement becomes the default for new translations in both languages. Applying a changed requirement updates existing sections and clears affected expert/publication approvals, with an explicit confirmation and audit entry. Item exceptions remain possible in the content reference section. Migration 021 stores page requirements; restart the API after updating.

The layout supports keyboard focus, explicit field labels, text-based status indicators, unsaved-edit warnings, large controls and stacked English/translation fields on smaller screens. It does not depend on colour to communicate status.

## What is implemented

English is the default for new visitors. Explicit language choices remain remembered. Bahasa Malaysia and Chinese have independent translation records. Existing bundled translations are unverified suggestions, never automatically approved.

Admin → Language & translations provides search, section/status filters, draft editing, source comparison, preview, review comments, approval and recent audit history. Existing English CMS editors remain the source editors. There is no external AI service or automatic AI publication.

The catalogue covers the existing English language dictionary, Education & Events CMS text, published activity descriptions, event registration instructions, and English-source published content pages, FAQs, resources and directory descriptions. Identifiers, URLs, dates, contact details, delivery modes and language metadata are not translated. Other hardcoded English interface text stays English; it cannot become an unverified machine translation.

## Use

1. Open Admin → Language & translations and choose Bahasa Malaysia or Chinese.
2. Find a source. Enter a translation or explicitly copy the existing suggestion as a draft.
3. Classify the review requirement. Header/footer/common labels default to Standard; other content defaults conservatively to Medical. RCBC must classify actual content appropriately, rather than relying on keyword detection. Use Professional for content needing professional review.
4. Save draft, then Submit for review. Drafts remain hidden.
5. For Medical/Professional, assign a relevant reviewer under Designated expert reviewers. RCBC records the verified expertise against an existing active account. Assigned trainers see Translation reviews in their portal. An author cannot record their own expert review.
6. The expert records review or returns it for corrections with a comment. RCBC admin then selects Approve & publish. Standard translations require RCBC approval without the expert step.
7. Public visitors selecting that language see the approved translation. Unapproved, missing or stale text falls back to English. A notice explains partial English content. The approval dictionary refreshes on window focus and every 30 seconds.

Changing text or review category creates a draft and clears prior approvals. Each save/review has a revision check, preventing one reviewer overwriting another's changes. Approval actions and snapshots are recorded with the acting account.

## English edits

Public output checks both approval and the exact current English source. English changes immediately prevent stale dictionary entries from matching updated content. The next catalogue refresh persists Needs re-review, withdraws approvals and preserves the old English and translated text for comparison. Reverting English does not silently restore an approval once that change has been detected. Removed sources are also invalidated.

## Setup

Migration 020 creates translation entries, designated reviewer assignments and review history. Restart the API after updating code. No previous translations are certified by the migration and no programmes, accounts or participant records are deleted.

Existing public English text is the baseline source; this feature does not replace the existing English content publication process. RCBC still owns source accuracy and appropriate expert selection. Published learning materials in other languages are not automatically translated documents.

Legacy non-English content-page and FAQ variants remain in the CMS, but public website text now uses the English canonical records and approved translation entries. Copy any legacy wording into the new translation editor for review; it is not automatically certified or deleted.

## Verification

- Logic tests cover source matching, stable identifiers, fallback, review transitions and expert permissions.
- The PostgreSQL integration test creates a separate temporary schema, runs the migrations, checks the API draft/approve workflow, independent languages, stale revision rejection, expert requirements and invalidation after English edits, then removes the test schema.
- Run `npm test` for the normal suite. Configure `TEST_DATABASE_URL` to run database integration tests in isolated schemas; never point it at a server where temporary schemas are prohibited.
- Manual acceptance: approve a harmless navigation label, switch language, refresh/focus, verify only the approved language changes; save a draft and verify it stays hidden; change English programme content and verify fallback and Needs re-review; test a medical item with an expert and separate admin approval; check mobile layout and keyboard navigation.

No AI translation is sent to a third party. AI draft generation can be added separately after RCBC chooses a provider and approves costs/data handling.

## Reusing existing project wording

### Bulk publication

In Review translations, Approve all eligible opens a confirmation window. From the page overview it covers all website pages; inside a page it covers only that page. Select Bahasa Malaysia, Chinese or both, inspect the count and optional wording preview, acknowledge the selection, then approve.

Only current, non-empty translations waiting for review are eligible. Medical/professional text still requires its expert review. Drafts and text needing updates are excluded. Imported drafts must first be sent for review using Save & send for review or Send saved page drafts for review.

Bulk publication is admin-only, supports up to 5000 entries, checks the confirmed page/language scope, locks and rechecks every revision, and commits the selection in one transaction. If an item changed or is no longer eligible, none of that batch is published; close the confirmation, refresh and review again. Every approved section has its own history entry with the acting administrator and batch identifier. The dialog supports keyboard focus, Escape/cancel, a focus trap, language-specific counts and visible ineligible-item totals.

The maintenance command `node --env-file-if-exists=.env scripts/reuse-translations.js --publish-standard` previews available wording without writing anything. Adding `--apply --actor-email=<authorising administrator email>` records the import against an active admin. It creates missing translation entries only, preserves every existing saved entry, respects page review requirements, and records save/submit/approval history for standard publication. Medical/professional wording remains draft and receives no expert review marker. Running the import again does not overwrite edits or duplicate entries.

Existing wording covers the bundled interface translations. New CMS descriptions and event content without existing translated wording still require translation and review.
