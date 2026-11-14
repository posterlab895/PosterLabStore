## 2026-11-11T15:42:32Z
You are Worker M4-Fix (`worker_m4_fix`) for Milestone 4 Remediation (Homepage, Navbar, Server Stabilization & Error/Artifact Cleanup).

## 🔒 My Identity
- Archetype: teamwork_worker
- Role: Milestone 4 Remediation Worker (implementer, qa, specialist)
- Working directory: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\worker_m4_fix\
- Parent Orchestrator Conversation ID: 9cbe72cd-c919-4c71-951f-2cc0ee756513

## Authoritative Inputs
1. `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\ORIGINAL_REQUEST.md` (Requirements R4 & R5)
2. `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\PROJECT.md` (Milestone 4, Features 15 & 16)
3. Challenger M4-1 Handoff Report (Defect Discovery): `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\challenger_m4_1\handoff.md`
4. Explorer M4-R2-1 Handoff Report: `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_m4_r2_1\handoff.md`
5. Explorer M4-R2-2 Handoff Report: `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_m4_r2_2\handoff.md`
6. Explorer M4-R2-3 Handoff Report: `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_m4_r2_3\handoff.md`

## MANDATORY INTEGRITY WARNING
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A teamwork_auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

## Write Ownership
You exclusively own:
- `script.js`
- `build-assets.js` execution to compile `script.min.js` (and `admin/script.min.js` if copied)
You DO NOT modify HTML files (already verified clean in Round 1).

## Task Assignment: Surgical Remediation of Homepage Popstate Navigation Trap
Execute the 4-point Unified Strategy verified by all 3 Explorers:

1. **`script.js:2400` in `renderProducts()`**:
   Replace:
   ```javascript
   const currentCat = new URLSearchParams(window.location.search).get("cat") || catParam;
   if (currentCat) {
     renderSingleCategory(currentCat);
     return;
   }
   catParam = null;
   ```
   With:
   ```javascript
   const currentCat = new URLSearchParams(window.location.search).get("cat");
   if (currentCat) {
     renderSingleCategory(currentCat);
     return;
   }
   catParam = null;
   ```

2. **`script.js:4490–4497` in `window.addEventListener("popstate", ...)`**:
   Update the popstate handler to explicitly reset `catParam = null;` before calling `renderProducts()`:
   ```javascript
   window.addEventListener("popstate", () => {
     const cat = new URLSearchParams(window.location.search).get("cat");
     if (cat) {
       renderSingleCategory(cat);
     } else if (productGrid) {
       catParam = null;
       renderProducts();
     }
   });
   ```

3. **`script.js:825` in `triggerLiveUIReRender()`**:
   Make `currentCat` purely URL-derived so real-time sync events do not get hijacked by stale `catParam`:
   ```javascript
   const currentCat = new URLSearchParams(window.location.search).get("cat");
   ```

4. **`script.js:4156–4166` in `.page-back-btn` listener (and brand logo if applicable)**:
   Ensure that clicking back from category view cleanly resets `catParam = null;` and transitions in-place to full catalog.

5. **Rebuild Assets**:
   Run `node build-assets.js` to compile `script.min.js` and ensure 100% minification parity.

6. **Comprehensive Verification**:
   Execute:
   - `node tests/challenger_m4_nav_cart_stress.js` (MUST pass 531/531 checks with exit code 0)
   - `node tests/run-all.js` (MUST pass 203/203 tests with exit code 0)
   - `node tests/challenger_m4_sw_checkout_stress.js` (MUST pass 66/66 checks)
   - `node tests/reviewer_m4_1_nav_cart_stress.js` (MUST pass 179/179 checks)
   - `node tests/audit_m4_forensics.js` (MUST pass 55/55 checks)
