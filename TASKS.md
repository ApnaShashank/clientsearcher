# Creightweb Calling CRM — Build Tasks

## Phase 1: Cleanup, Data Model, MongoDB & Auth/Roles
- [x] **1.1 Cleanup old features**: Removed AI lead search, AI outreach, rewards, portfolio, download zip, and legacy components/APIs.
- [x] **1.2 Install dependencies**: Installed all npm packages including `bcryptjs`, `@types/bcryptjs`, `jose`, `xlsx`, and `pdf-lib`.
- [x] **1.3 Data models & types**: Defined `Lead`, `User`, `CallLog`, `Batch`, `AdminTask`, `ActivityLog`, `AppSettings` in `src/types/crm.ts`.
- [x] **1.4 MongoDB & seeding**: Upgraded `src/lib/db.ts` with Creightweb collections, unique phone/username indexes, and auto-seeding for Admin & default dropdowns.
- [x] **1.5 Auth & role/ownership guards**: Implemented bcrypt hashing, JWT cookie sessions (`jose`), `/api/auth/login|logout|me`, active-caller checks, and `requireAdmin`/`requireCaller` in `src/lib/auth.ts`.
- [x] **1.6 Activity logging & pitch hint helper**: Implemented `logActivity` in `src/lib/activity.ts` and `generatePitchHint` in `src/lib/pitchHint.ts`.

## Phase 2: Admin Panel (Desktop-First SaaS Dashboard)
- [x] **2.1 Design system & Admin shell**: Set up Finexy light theme (`#F5F5F3`, `#FFFFFF`, `#FF5C1C`, `#111`), Inter font, slim left icon sidebar, top bar, and `/login` page.
- [x] **2.2 Admin Dashboard (`/admin`)**: Implemented KPI cards, 14-day calls bar chart, and today's per-caller performance table.
- [x] **2.3 Leads management (`/admin/leads`)**: Built multi-filter leads table, bulk select & assign, lead detail drawer, and deliberate lead recycle action.
- [x] **2.4 Manual Add Lead (`/admin/leads/new`)**: Built manual lead form with Admin-managed dropdowns, WhatsApp toggle, services multi-select, and duplicate phone guard.
- [x] **2.5 Import Leads (`/admin/import`)**: Built CSV/Excel upload, downloadable `.xlsx` template, row validation, duplicate rejection report, and pre-save summary.
- [x] **2.6 Callers management (`/admin/callers`)**: Built caller creation, one-click activate/deactivate, password reset, and lifetime stats cards.
- [x] **2.7 Assign / Batches (`/admin/batches`)**: Built unassigned pool filter (city + area + category), batch scheduler with `visibleFrom`, and batch status table.
- [x] **2.8 Worked / History & Activity (`/admin/history`)**: Built called leads audit trail with call logs and full system activity feed.
- [x] **2.9 Admin Tasks (`/admin/tasks`)**: Built Admin checklist with To Do, Pending/Overdue, and Done groups.
- [x] **2.10 Settings (`/admin/settings`)**: Built dropdown manager for cities, categories, and services to pitch.

## Phase 3: Caller App (Mobile-First, 390px-First)
- [x] **3.1 Caller mobile shell**: Built `CallerShell` with fixed bottom tab bar (`Today`, `Follow-ups`, `My Stats`, `Report`) and instant deactivation lock.
- [x] **3.2 Today tab (`/caller`)**: Built progress header + single-lead card with auto-generated pitch hint, collapsible address, Google rating, `CALL NOW` (`tel:`) and WhatsApp buttons.
- [x] **3.3 One-tap outcome & CallLog flow**: Built `CallCardFlow` with 8 one-tap outcomes, optional note/duration, required Callback date, and auto-advance to next lead.
- [x] **3.4 Follow-ups tab (`/caller/followups`)**: Built due-today + upcoming callback list with same call & outcome flow.
- [x] **3.5 My Stats tab (`/caller/stats`)**: Built Today/This Week/Total stats switcher and 7-day bar chart.

## Phase 4: Reports, PDF Generation & Landing Page
- [x] **4.1 Admin Reports (`/admin/reports`)**: Built date-range report per caller and overall with CSV, Excel (`.xlsx`), and branded PDF export.
- [x] **4.2 Caller Report tab (`/caller/report`)**: Built date picker + branded Creightweb PDF download (masked phone last-4 only).
- [x] **4.3 Public Landing Page (`/`) & Login (`/login`)**: Built Creightweb Calling CRM hero, 3 feature cards, Finexy dashboard preview mock, and single Login button.

## Phase 5: Polish, Verification & Build
- [x] **5.1 Environment & docs**: Updated `.env.example` with `MONGODB_URI`, `JWT_SECRET`, and `ADMIN_USERNAME`/`ADMIN_PASSWORD`.
- [x] **5.2 Build & typecheck verification**: `tsc --noEmit` and `npx next build --webpack` passed with 0 errors across all 36 app/API routes.
