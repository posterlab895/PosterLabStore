# Original User Request

## Initial Request — 2026-11-09T23:50:43Z

Audit, stabilize, and update the Poster Lab Store for production: verify product pricing tiers, synchronize and customize the admin panel with store products, simplify the product page with dynamic frame switching (black, white, transparent) and a wall-like background, and stabilize the homepage, navbar, and server connections.

Working directory: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore
Integrity mode: development

## Requirements

### R1. Product Pricing Structure
Audit and update product pricing across the store to match the specified dimensions in centimeters in the store's currency: 20x30 cm = 180, 30x40 cm = 200, 40x50 cm = 250, and 50x70 cm = 300.

### R2. Admin Panel Customization and Synchronization
Edit and customize the admin panel, verifying all connections are active and operational so that any changes made in the admin panel (products, prices, frames, stock) are listened to and synchronized live with the store's real products.

### R3. Product Page Simplification and Frame Visualization
Simplify the product page interface and display poster images inside a black frame by default, dynamically switching to a white frame when selected, or transparent/frameless, with a white wall-like background behind the posters for a clean, professional look.

### R4. Homepage, Navbar, and Server Stabilization
Audit the homepage and navbar for errors, stabilize the website and server connections, and ensure smooth operation across the site without conflicts or runtime issues.

### R5. Audit for Errors and Unrequested Features
Audit the codebase to identify and fix any errors and remove or flag any unrequested features or leftover artifacts.

## Acceptance Criteria

### Product Pricing
- [ ] Products with dimensions 20x30 cm, 30x40 cm, 40x50 cm, and 50x70 cm reflect the exact prices 180, 200, 250, and 300 respectively in the store.
- [ ] Price updates are reflected consistently across product listings, detail views, and cart/checkout flows.

### Admin Panel Synchronization
- [ ] Admin panel connects and communicates reliably with backend data storage.
- [ ] Edits to products in the admin panel immediately synchronize to and update the live store products.
- [ ] Admin panel operations execute without connection failures or unhandled errors.

### Product Page Experience
- [ ] Product page displays poster previews with a black frame by default.
- [ ] Selecting the white frame option updates the preview to display a white frame.
- [ ] Selecting transparent removes or clears the frame around the poster preview.
- [ ] Poster display area includes a clean white wall-like background behind the framed poster.
- [ ] Product page layout is simplified and free of visual layout bugs or JavaScript console errors.

### Homepage, Navigation, and Server Stability
- [ ] Homepage loads cleanly with no broken assets, console errors, or failed network requests.
- [ ] Navigation bar links and controls operate correctly across viewports.
- [ ] Server and connection handling remain stable and resilient under simultaneous page navigation and admin updates.
- [ ] Codebase audit completes with all detected runtime errors resolved and unrequested features removed.
