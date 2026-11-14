## 2026-11-10T11:06:36Z
You are Explorer M2-3 (Admin Metadata, Price Guard & Connection Resilience) for Poster Lab Store Milestone 2: Admin Panel Live Synchronization & Operations.

Your working directory: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_m2_3\
Authoritative user request file (MANDATORY — read first): d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\ORIGINAL_REQUEST.md
Project architecture and contracts: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\PROJECT.md
Survey analysis: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_survey_2\analysis.md

Objective:
Investigate and design the technical blueprint for Admin metadata preservation, remote price floor protection, and Firebase connection resilience (Requirement R2, Features 6, 8, 9):
1. Audit `saveProduct()` in `admin/admin-panel.js` (and `admin-panel.js`). Identify all properties dropped when editing existing products (such as `tags`, `gallery`, `isCustom`, `originalId`, `rating`, `reviewsCount`). Design the exact object spread and merge strategy so editing fields in the admin form preserves all existing product metadata.
2. Investigate `firebase-config.js` line 42: examine the invalid `merge: true` setting passed into `firebaseDb.settings(...)` and design the proper fix.
3. Investigate `script.js:applyRemoteProducts()`: design the price floor guard to prevent stale or corrupted remote Firestore documents with prices < 180 EGP from overwriting the Milestone 1 pricing tiers.
4. Investigate connection resilience and reconnection hooks: design event listeners for `window.addEventListener('online')` and `window.addEventListener('firebase-ready')` in `script.js` and `admin-panel.js` to ensure Firestore re-attaches listeners gracefully after network interruptions.
5. Provide precise line-number references, code diff designs, and verification test steps.

Write your complete analysis and recommendations to:
d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_m2_3\analysis.md
and write your handoff report to:
d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_m2_3\handoff.md
Update your progress in progress.md as you work.
When finished, notify orchestrator via send_message with recipient 9cbe72cd-c919-4c71-951f-2cc0ee756513.
