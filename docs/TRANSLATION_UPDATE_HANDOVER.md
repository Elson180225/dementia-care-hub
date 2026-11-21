# Dementia Care Hub — Multilingual Content and Translation Approval Update

**Project:** Dementia Care Hub / Dementia Care Connect (Project A)  
**Languages:** English (`en`), Bahasa Malaysia (`ms`) and Chinese (`zh`)  
**Scope:** Public-facing website text and its integration with the existing RCBC translation-review workflow  
**Prepared:** 21 November 2026

## 1. Background

The newer website uses an admin-controlled translation workflow. Public visitors receive approved translations from the API; otherwise, the English source is displayed. This made language switching appear broken when many existing Malay and Chinese translations had not yet been approved. Some newly introduced page text was also written directly in English in JSX, outside the translation catalogue.

This update makes existing and newly added public copy translatable while **preserving RCBC approval as the requirement for publishing translations**. The local preview is strictly a development aid, not a replacement for approval.

## 2. Work completed

### A. Restore local translation preview

- Added an opt-in local preview that displays existing bundled Malay and Chinese suggestions on the development website.
- Ensured already-approved translations take priority over bundled suggestions.
- Preserved English fallback when a translation is missing, unapproved, or does not match the current English source in normal production operation.
- Added a visible notice distinguishing the local translation preview from publicly approved translations.
- The preview flag is checked together with Vite's development mode; it is **not enabled in a production build**.

Configuration for **local development only**:

```dotenv
VITE_PREVIEW_BUNDLED_TRANSLATIONS=true
```

### B. Make hardcoded public-facing English text translatable

- Introduced a reusable `Trans` component and catalogue-based label lookup for fixed interface text.
- Added Malay and Chinese suggestions for previously hardcoded labels, as well as missing wording for newer website content.
- Updated public-facing pages and components, including:
  - Header, footer, search, home slideshow, and statistics/accessibility labels.
  - Understanding Dementia, dementia guidance and Healthy & Active Living content.
  - Find Help & Support, Assessment & Healthcare, Resource Finder, support services, financial help and practical equipment directories.
  - Caregiver Support, including support-group loading/errors and programme notices.
  - Education & Events, event registration/controls and trainer-related public information.
  - About the Project, Contact, programme intakes and parts of the first-visit Welcome Guide.
- Kept underlying record identifiers, URLs, links, database fields and filtering values separate from displayed translations.

### C. Integrate fixed labels with the admin approval catalogue

- Added **262 fixed public labels** to the translation catalogue, each with a distinct key such as `ui/inlineCopy/eventDetailsClose`.
- Assigned labels to their corresponding admin workspace pages rather than grouping all of them under shared navigation.
- Made ordinary interface labels **Standard** by default while retaining **Medical** or **Professional** default review requirements for selected medical descriptions and programme/governance claims.
- Continued to respect existing server-side page requirements and previously saved item-specific review settings.
- Fixed catalogue filtering so certain valid labels (including terms ending in “poster”) are not omitted from review.

### D. Avoid incorrect approval reuse

- Changed fixed labels to look up translations by their **own stable catalogue key**, rather than solely by matching an English sentence.
- Kept the legacy English-text lookup conservative when the same source text occurs in different contexts.
- Prevented an approval for one label from unintentionally displaying a translation for a different label with identical English wording.
- Required the current English source to match the approved entry; outdated approvals do not automatically replace changed English wording.

## 3. Production approval behaviour

The update **reuses the project's existing database-backed RCBC review and publication system**; it does not automatically approve any imported or suggested translations.

1. An administrator opens **Admin → Language & translations**, chooses a language and page, and reviews the proposed wording.
2. A translation is saved and sent for review. Draft/unapproved wording remains hidden on the public website.
3. Items marked Medical or Professional require the relevant expert review under the existing workflow.
4. RCBC then selects **Approve & publish**.
5. The public website retrieves the approved text through `/api/public/translations?language=ms` or `?language=zh`; anything not approved or no longer matching the English source remains in English.

The frontend refreshes approved translations when the window gains focus and at approximately 30-second intervals. **The end-to-end approval flow has not yet been verified against the user's actual PostgreSQL database.**

## 4. Notable source files

| File or group | Role |
| --- | --- |
| `src/i18n/LanguageContext.jsx` | Language state; approved API translations; development-only preview; label lookup |
| `src/i18n/bundledPreview.js` | Bundled suggestions for local preview, with approved wording prioritized |
| `src/i18n/Trans.jsx` | Displays fixed labels through stable translation keys |
| `src/i18n/inlineCopy.js` | English source and Malay/Chinese suggestions for fixed labels |
| `src/i18n/supplementalCopy.js` | Missing suggestions for newer existing catalogue content |
| `src/i18n/labelLookup.js` | Key-specific translation resolution and conservative legacy fallback |
| `src/i18n/translations.js` | Main English, Malay and Chinese translation catalogue |
| `src/i18n/TranslationNotice.jsx` | Partial-translation / local-preview notice |
| `shared/inline-copy-metadata.js` | Admin page mapping and default review category for fixed labels |
| `shared/translation-workspace.js` | Associates those keys with the relevant page in the admin review workspace |
| `shared/translation-review.js` | Catalogue inclusion and review requirements |
| `src/components/**`, `src/pages/**` | Public components and pages updated to use translatable wording |
| `tests/bundled-preview.test.js` | Local preview and fallback tests |
| `tests/public-language.test.js` | Public content translation tests |
| `tests/inline-translation-approval.test.js` | Stable keys, classification and approval isolation tests |

Across the three delivery packages there are **32 unique changed or new paths**. The latest approval-fix ZIP is **incremental**, not a complete replacement for the earlier translation changes.

## 5. How to apply the provided packages

Apply these ZIP packages to the same project in this order, preserving the relative paths:

1. `dementia-care-hub-language-preview-changed-files.zip`
2. `dementia-care-hub-i18n-hardcoded-changed-files.zip`
3. `dementia-care-hub-admin-approval-i18n-fix-changed-files.zip`

If the first two packages were already applied, only apply the third. Do not overwrite the project's `.env`, database or unrelated team changes. Review the resulting Git diff before committing, especially if teammates changed any of the same files.

This set of packages does **not** add database migrations or change database credentials. The pre-existing translation approval feature still needs its own required database setup to be operational.

## 6. Validation and known limitations

**Verified in the supplied code:**

- Focused checks covering local preview, translation suggestions, unique label keys, page grouping, Standard/Medical/Professional defaults, stale-source fallback and duplicate-English approval isolation.
- All **15 tests in the three translation-update-specific test files** passed when rerun together for this handover.
- An earlier broader set of **28 focused checks** also passed.

**Not yet confirmed end-to-end:**

- The full `npm test` run in the preparation environment yielded **61 passed and 12 failures caused by an unavailable `pg` module**; these were import/dependency errors, not reported translation assertion failures. Re-run after `npm.cmd ci` on a complete local installation.
- The production Vite build was not available in the preparation environment because its Vite dependency was missing.
- A real administrator saving, reviewing, approving and publishing a new label against PostgreSQL has not been manually verified.
- Some database-managed resource descriptions, organisation names, uploaded event information, and text without a catalogue entry may still appear in English until entered and approved separately.
- Malay and Chinese wording provided in these files is **suggested copy** and should be reviewed by RCBC, especially for medical and programme-related content.

## 7. Recommended pre-merge checklist

- [ ] Confirm the three packages were applied in order and inspect `git diff` for unintended changes.
- [ ] Run `npm.cmd ci`, `npm.cmd test`, and `npm.cmd run build` on the full project.
- [ ] Start the API (`npm.cmd run server`) and frontend (`npm.cmd run dev`).
- [ ] With `VITE_PREVIEW_BUNDLED_TRANSLATIONS=true`, inspect English, Malay and Chinese on representative public pages.
- [ ] Change the flag to `false`, restart the frontend, and verify unapproved labels remain English.
- [ ] In Admin → Language & translations, approve one **Standard** label and verify only that label changes on the public page.
- [ ] Confirm that another label with identical English wording does not receive that approval.
- [ ] Confirm Medical/Professional content still requires its relevant expert review.
- [ ] Check mobile layouts, search, resource filtering, hyperlinks and keyboard/accessibility labels.
- [ ] Request a teammate's review and approval on the GitHub PR; do not self-merge.

## 8. Suggested GitHub pull request

**Title:** Fix multilingual public content and integrate labels with RCBC translation approvals

**Description:**

### Summary
- Restore existing Malay/Chinese translations as an **opt-in, development-only preview**, without bypassing publication approval.
- Replace hardcoded English text across public website sections with keyed, reviewable translations.
- Add missing Malay/Chinese suggestions and 262 fixed-label entries to the translation catalogue.
- Group new labels under relevant RCBC admin pages with appropriate default review requirements.
- Prevent duplicate English text from reusing the wrong approved translation; retain English fallback for unapproved/outdated content.

### Testing
- 15 translation-update-specific tests passed; 28 focused checks passed during earlier validation.
- Full suite and production build require local verification (the preparation environment lacks the required `pg`/Vite packages).
- Live PostgreSQL admin-to-public approval workflow remains to be tested before merge.

### Reviewer notes
- New language text is **suggested wording**, not auto-published content.
- Public visitors continue to see only approved translations. Local preview is Vite development-only and opt-in.
- No `.env` files, database migrations or full repository replacements are part of the change packages.
- Please review language accuracy, approval categories and representative desktop/mobile pages before approving.
