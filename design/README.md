# Handoff: MiraCore Admin UI Redesign

## Overview
UI-only redesign of the MiraCore admin panel. One file, `MiraCore Admin.dc.html`, is an interactive prototype covering every screen with a shared sidebar/topbar shell and working in-prototype navigation (click sidebar items to switch screens, click through the Products modals, Settings tabs, etc). No new backend features — this is a visual/layout refresh of screens that already exist and work in the codebase.

## About the Design File
`MiraCore Admin.dc.html` is a **design reference built as a standalone HTML prototype** — not production code to copy in. Open it directly in a browser; it's fully clickable. The task is to **recreate this look in the existing codebase**, using its current framework, components, state management, routing, and API calls — not to port the HTML/inline-styles directly.

## Fidelity
High-fidelity. Colors, spacing, type sizes, copy, and grouping in the file are final — match them closely. Sample/mock data (table rows, geo dropdown options, audit log entries) is illustrative only; keep the app's real data and logic.

## ⚠️ Critical constraint: UI only, do not break functionality
- Do not change API calls, data fetching, routing, prop/state shapes, validation logic, or business rules.
- Every button, field, and interaction that currently works must keep working exactly the same way — only its appearance (and, where explicitly noted below, its layout/grouping) should change.
- If a UI change seems to require a functional change (e.g. a new field), flag it instead of guessing at backend/behavior.

## Screens (all in the one file)

0. **Login** — loads first. Gradient background (light indigo → neutral → soft red, echoing the logo), centered card with logo mark, email/password, "Forgot password?" link, Sign in button. Brand shown as "MiraAdmin" on this screen specifically (sidebar wordmark elsewhere is unchanged, "MiraCore" — confirm which is correct before implementing both). Sign in leads into the app shell below; a "Log out" link in the app topbar returns to this screen (demo-only affordance, wire to real auth instead).

Once signed in, use the sidebar to switch screens:

**Sidebar nav** — grouped under section labels: Overview (Dashboard), Operations (FSP Tenants, Onboarding, Products, Loans, Users), Communications (Messages, Trigger Message, Notifications), System (Settings, Audit). Active item highlighted with light indigo background + indigo text.

1. **Product Management** — table with right-aligned numeric columns, zebra striping, color-coded status pills, tooltipped row actions.
2. **Review Product modal** (opens on the table's eye icon) — fields grouped into Identifiers / Terms & Pricing / Amount Limits / Eligibility sections, description in a callout box.
3. **Edit Product modal** (opens from Review's Edit button) — same grouped-sections pattern, read-only tenant fields grayed out.
4. **FSP Onboarding** — 5-step connected stepper; Organization step form grouped under "Organization Details" / "Address". Address field order (deliberate behavior change): Country → Region/City → District → Ward → Post Code (auto-filled, read-only) → Address Line 1, each dropdown cascading from its parent (changing a parent clears its children). Sample Tanzania geo data is illustrative — wire to the real geo data source.
5. **FSP Tenants** — status filter + New FSP button, table with polished empty state and pagination footer.
6. **Tenant Users** — Roles & permissions button, Invite User, table with role/active pills and per-row actions.
7. **Settings** — tenant selector (full width), underline tabs (Profile / MIFOS / API Keys / Certificates):
   - Profile: responsive field grid (fills available width, no more fixed narrow card) + Subscription section.
   - MIFOS: Mode dropdown + Save/Validate.
   - API Keys: key name + Create Key, table with empty state + pagination.
   - Certificates: upload PEM cert/key buttons + disabled Upload.
8. **Trigger Message** — search bar with Search button, Loan Lookup + History cards, Message Composer card with type dropdown and empty/composing states.
9. **Audit Logs** — filter row (action text + status dropdown), table with status pills, pagination.
10. **Loan Management** — full-width table (fixed: original was capped narrow leaving a horizontal scrollbar/blank gap), refresh button, empty state, pagination.
11. **Notifications** — Message/Status/Created/Action table, empty state, pagination.

## Design Tokens
- Primary: `#2A3A8F` (buttons, active nav, links), hover `#233279`
- Text: dark `#1A2233`, secondary `#475467`, muted `#98A2B3` / `#6B7280`
- Borders: `#D6DAE3` (inputs), `#E5E8EF` / `#EEF0F4` (cards, dividers)
- Backgrounds: page `#F3F5F9`/`#F7F8FB`, card `#fff`, disabled field `#F7F8FB`
- Status pills: green `#E7F6EC`/`#12794A`, gray `#F2F4F7`/`#475467`, red `#FEECEC`/`#B42318`, indigo (role chip) `#EEF0FB`/`#2A3A8F`
- Font: Roboto (400/500/700)
- Radius: 8px (buttons/inputs), 12–14px (cards/modals)

## Layout fixes worth calling out
- Tables should use `width: 100%` of their container (not a fixed px width) so they fill the page instead of leaving blank space or a horizontal scrollbar, as seen on the original Loan Management and Settings screens.
- Form field grids use a responsive `repeat(auto-fit, minmax(220px, 1fr))` pattern so they fill wide screens instead of being capped to a narrow fixed width.

## Files
- `MiraCore Admin.dc.html` — everything, open directly in a browser to click through.
- `assets/logo.ico` — logo mark used on the login screen.
