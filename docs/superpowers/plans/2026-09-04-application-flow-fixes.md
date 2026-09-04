# Application Flow Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every client-side route and critical local/demo flow behave consistently, while making configured Supabase and external-service failures explicit and recoverable.

**Architecture:** Keep the existing React/Vite SPA and data abstraction. Centralize role/route rules and environment capability checks, then correct each feature at its boundary instead of adding page-specific workarounds. Preserve the localStorage fallback for flows that can be meaningfully demonstrated offline.

**Tech Stack:** React 19, TypeScript, React Router 7, Supabase, Vite, Tailwind CSS, Motion.

**Spec:** Approved in-chat debugging design from 2026-09-04.

**Global Constraints**

- Do not change unrelated UI styling or deployment configuration.
- Do not expose new secrets or commit `.env` values.
- Verify every production change with a regression test or a reproducible route/flow check.
- Keep `npm run lint` and `npm run build` passing.

---

### Task 1: Establish route and authentication contract

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/context/AuthContext.tsx`
- Modify: `src/components/AuthModal.tsx`
- Test: `tests/auth-flow.test.ts` or a route-flow check if no test runner exists

- [ ] Verify role behavior for family, super_admin, admin, and caregiver in both local and Supabase modes.
- [ ] Ensure admin/caregiver access is not incorrectly treated as unauthorized when their role is supported by the auth model.
- [ ] Ensure local caregiver signup has a usable facility path or a clear intentional limitation.
- [ ] Ensure profile/facility state is preserved consistently after signup, sign-in, refresh, and sign-out.

### Task 2: Make data operations consistent across storage modes

**Files:**
- Modify: `src/lib/db.ts`
- Modify: `src/lib/supabase.ts`
- Test: `tests/db-flow.test.ts` or deterministic data-layer checks

- [ ] Verify all localStorage CRUD functions use stable user/facility keys.
- [ ] Verify Supabase requests include the fields expected by the current migrations.
- [ ] Verify empty, malformed, and failed responses fall back without leaving loading states active.
- [ ] Remove behavior where a successful UI update can be reported despite no persisted change.

### Task 3: Remove hard dependencies from offline-capable pages

**Files:**
- Modify: `src/pages/AddClothing.tsx`
- Modify: `src/pages/Wardrobe.tsx`
- Modify: `src/pages/Psychique.tsx`
- Modify: `src/pages/Alerte.tsx`

- [ ] Make clothing add/list/delete usable in local mode without Supabase Storage or Hugging Face.
- [ ] Make the clothing scanner show a configuration error before attempting an upload and avoid unused uploads.
- [ ] Make AI chat display a clear unavailable state when Groq is not configured instead of issuing an invalid request.
- [ ] Make camera access cleanup reliable when leaving the safety page.
- [ ] Make SOS activation obey its displayed hold duration and avoid duplicate pointer/touch activation.

### Task 4: Align database contract and current migrations

**Files:**
- Modify: `supabase_schema.sql` only if required after code verification
- Modify: `db.md` only if current documentation is stale after fixes
- Test: SQL/code contract inspection

- [ ] Compare current role, facility, staff, doctor, psychologist, and family-contact usage with the migration chain.
- [ ] Ensure first-time setup instructions do not direct users to a schema that contradicts the application.
- [ ] Do not duplicate migration logic if the repository already has the authoritative migration files.

### Task 5: Verify all endpoints and final quality gates

**Files:**
- No additional production files unless a verification failure identifies one.

- [ ] Check `/`, `/besoins`, `/psychique`, `/telemedicine`, `/rappels`, `/alerte`, `/loisirs`, `/caregiver`, `/vetements`, `/vetements/ajouter`, and `/admin/staff`.
- [ ] Check unauthorized redirects and unknown-route fallback.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Inspect `git diff` and confirm only intended files changed.
