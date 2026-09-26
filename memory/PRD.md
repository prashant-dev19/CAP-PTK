# PRD — Cricket Association Pathankot (CAP) Website

## Original Problem Statement
Create a website for Cricket Association Pathankot — the official cricketing body for District Pathankot, affiliated to PCA Mohali. The body is responsible for cricket in Pathankot: selections, making teams (U-14, U-16, U-19, U-23, Seniors — men and women), taking trials and formalising teams after selection, then sending teams for inter-district matches.

User choices (from clarification): main goal = tell about the association + contact form + player registration form; vibe = "Cricket Elegant"; real content = user will provide later (use clearly-marked placeholders); admin panel = yes.

## User Personas
- **Player / Parent**: wants to learn about CAP and register for district trials.
- **Association official (admin)**: wants to view incoming player registrations and contact messages securely.
- **Visitor / Press**: wants affiliation info, contact route.

## Core Requirements (static)
1. Official institutional presence: about, PCA Mohali affiliation, squads (U-14/U-16/U-19/U-23/Seniors, men & women), selection pathway (trials → selection → squad formation → inter-district).
2. Player registration form (persisted).
3. Contact form (persisted).
4. Admin login + dashboard listing registrations & messages (JWT, bcrypt, brute-force lockout).
5. Tournament lists: explicitly deferred by user (maybe later).

## Architecture
- **Backend**: FastAPI (server.py, all routes under /api), MongoDB via motor (MONGO_URL/DB_NAME from env). Collections: registrations, contact_messages, users (admin), login_attempts. uuid string ids; pydantic models; ISO datetimes.
- **Auth**: playbook-compliant JWT (access 15 min / refresh 7 days, httpOnly SameSite=None cookies + Bearer fallback), bcrypt hashes, admin seeded from env (ADMIN_EMAIL/ADMIN_PASSWORD), lockout after 5 failed logins/15 min, CORS restricted to frontend origin.
- **Frontend**: React (CRA), Tailwind tokens (pavilion green #0A1F16, ivory #F5F2EA, gold #CFA858), Cormorant Garamond + Manrope, Lenis smooth scroll + anchors, framer-motion masked line reveals & scroll reveals, CSS editorial marquee, grain overlay, custom SVG logo mark (cricket-ball seam) + favicon.
- **Pages**: `/` (Hero, Marquee, About, Squads, Pathway, Registration, Contact, Footer with office-bearer placeholders), `/admin` (login → dashboard with Registrations/Messages tabs).

## Implemented (2026-09-26)
- Full marketing site with kinetic hero (masked line reveal, parallax stadium bg, rotating seam-ball ornament), editorial marquee, squads hover list, pathway timeline, registration & contact forms with success states.
- Trials banner: dates intentionally shown as "To be Announced Soon" per user (update when decided).
- Real content added per user: office bearers (President Sh. Balbir Manhas, Sr. VP Sh. Satish Mahendru, VP Sh. Varun Thakur, Secretary Sh. Sunny Mahajan, Joint Secretary Sh. Prashant Sharma); office address Jodhamal Colony, Pathankot; phone 89680-44334; email cricketpathankot@gmail.com.
- Announcements (2026-09-26): officials post notices from the admin panel (POST/DELETE /api/admin/announcements, GET admin + public /api/announcements); notice board section renders on home when notices exist. One live notice posted: "District Trials — All Age Groups".
- Notice pinning (2026-09-26): POST /api/admin/announcements/{id}/pin toggles pin; pinning is exclusive (one pinned notice max); pinned notice sorts first on public + admin boards and shows a gold "Pinned" badge.
- CSV export (2026-09-26): GET /api/admin/registrations/export streams all registrations as a CSV download; "Download CSV" button in the admin panel's Registrations tab.
- Gallery (2026-09-26): 6-photo editorial mosaic of district cricket (representative stock photography until the Association's own album is provided).
- Instagram section (2026-09-26): elegant one-row section above the footer — follow card (@cappathankot, links to https://www.instagram.com/cappathankot/) + official token-free Instagram profile embed (blockquote + instagram.com/embed.js per playbook). Account verified public.
- Top notice strip (2026-09-26): gold highlight bar fixed at the very top of every page showing the pinned/latest announcement, linking to the Notice Board section; collapses on scroll.
- Notice share buttons (2026-09-26): every notice card (public board + admin panel) has WhatsApp share (wa.me with pre-filled notice title + site link) and Instagram (opens @cappathankot profile to share from the app); official crest logo (user-supplied PNG) replaces the placeholder mark in nav/hero/footer/admin/favicon.
- Squads page (2026-09-26): dedicated /squads route — squads grouped under Men's Wing (U-14, U-16, U-19, U-23, Seniors) and Women's Wing (U-15, U-19, U-23, Seniors) per user's category structure. Page displays ONLY backend-entered data: no seeded photos (dashed placeholder panel until officials add the group photo) and no register CTAs. Roster rows show name, jersey no., role, batting/bowling style. Managed from the admin "Squads" tab (photo URL + player editor + save → PUT /api/admin/squads/{id}); public GET /api/squads. Navbar/footer link to /squads; home squads section lists both wings (09 squads) and links to the page.
- Backend endpoints: POST /api/registrations, POST /api/contact, POST /api/auth/login, POST /api/auth/logout, POST /api/auth/refresh, GET /api/auth/me, GET /api/admin/registrations, GET /api/admin/messages, GET/POST/DELETE announcements (admin-protected writes).
- Admin dashboard (stats, tabs, dense tables) at /admin; seeded admin in /app/memory/test_credentials.md.
- Verified: 8/8 curl checks (incl. 401s), form submissions through UI reached admin tables, desktop + mobile screenshots clean, no horizontal overflow.

## Backlog / Prioritized
- P1: Trials dates — replace "To be Announced Soon" on the banner when the Association decides them.
- P1: Gallery — swap representative stock photos for the Association's own match album when shared.
- P1 (deferred by user): player portal / expanded backend panel — user wants website focus first.
- P2: Photo upload for registrations (object storage).
