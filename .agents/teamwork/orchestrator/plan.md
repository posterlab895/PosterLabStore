# Orchestrator Plan

## Goal
Audit, stabilize, and update the Poster Lab Store for production:
- R1: Audit and verify product pricing tiers (20x30 cm = 180, 30x40 cm = 200, 40x50 cm = 250, 50x70 cm = 300) across listings, details, and cart/checkout.
- R2: Admin panel customization and live synchronization with live store products (Firestore/backend).
- R3: Product page simplification with dynamic frame switching (black default, white, transparent) and a clean white wall-like background.
- R4: Homepage, navbar, and server stabilization.
- R5: Codebase audit for errors and unrequested features/leftover artifacts.

## Architecture & Execution Strategy (Project Pattern)

### Phase 0: Survey & Scoping
- Spawn 3 parallel survey explorers:
  - Explorer 1: Pricing architecture, data files, bundles, cart/checkout calculations, and sync mechanism.
  - Explorer 2: Admin panel architecture, backend/Firestore connections, live listener mechanisms, and catalog sync.
  - Explorer 3: Frontend UI, product page frame switching/wall background, homepage, navbar, and dead code/unrequested features.
- Merge survey reports into `PROJECT.md` (Feature Inventory, Architecture, Milestones, Interface Contracts, Code Layout).

### Phase 1: Dual Track Setup
- Track 1: Implementation Track
- Track 2: E2E Testing Track (derive comprehensive opaque-box test cases across Tiers 1-4).

### Phase 2: Milestone Execution
- M1: Product Pricing Structure & Data Consistency
- M2: Admin Panel Live Synchronization & Operations
- M3: Product Page Simplification & Dynamic Frame Visualizer
- M4: Homepage, Navbar, Server Stabilization & Error/Artifact Cleanup

### Phase 3: Final Acceptance & Adversarial Hardening (M5)
- Validate 100% pass on Tiers 1-4 E2E tests.
- Tier 5 Adversarial Coverage Hardening (Challenger -> Worker -> Reviewer).
- Final forensic audit and project completion reporting.
