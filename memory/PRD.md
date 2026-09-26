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
- Backend endpoints: POST /api/registrations, POST /api/contact, POST /api/auth/login, POST /api/auth/logout, POST /api/auth/refresh, GET /api/auth/me, GET /api/admin/registrations, GET /api/admin/messages.
- Admin dashboard (stats, tabs, dense tables) at /admin; seeded admin in /app/memory/test_credentials.md.
- Verified: 8/8 curl checks (incl. 401s), form submissions through UI reached admin tables, desktop + mobile screenshots clean, no horizontal overflow.

## Backlog / Prioritized
- P1: Trials dates — replace "To be Announced Soon" on the banner when the Association decides them.
- P1 (deferred by user): player portal / expanded backend panel — user wants website focus first.
- P2: Photo upload for registrations (object storage).
