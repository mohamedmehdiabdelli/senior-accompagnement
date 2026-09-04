# Facility Ownership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every retirement home an explicit facility ID and one owning super admin, then make staff invitations inherit that facility without client-side ambiguity.

**Architecture:** Add an owner relationship to `facilities` and expose security-definer RPCs for facility creation and staff invitations. Keep the existing localStorage fallback, but model local facilities with the same owner/facility relationship so demo behavior matches Supabase behavior.

**Tech Stack:** React 19, TypeScript, Supabase PostgreSQL/RLS, Vite.

**Spec:** Approved facility ownership design from 2026-09-04.

**Global Constraints**

- The authenticated profile is the source of truth for facility ownership.
- Clients must not choose the facility for an invitation.
- Existing facilities without an owner remain visible but require an explicit SQL backfill.
- Do not expose or commit credentials.

---

### Task 1: Add database ownership and RPC enforcement

**Files:**
- Create: `migration_facility_ownership.sql`

- [ ] Add nullable `facilities.owner_id` referencing `profiles(id)` with a unique constraint.
- [ ] Add `create_facility_for_owner(facility_name)` to create a facility and link the authenticated super admin atomically.
- [ ] Add `invite_staff_for_my_facility(invited_email, invited_role)` to derive `facility_id` from the authenticated profile.
- [ ] Add RLS policies that restrict staff invite management to the owner’s facility.
- [ ] Add a clear query to identify legacy facilities requiring owner backfill.

### Task 2: Align frontend authentication contracts

**Files:**
- Modify: `src/context/AuthContext.tsx`
- Modify: `src/components/AuthModal.tsx`

- [ ] Return the created facility ID from super-admin signup.
- [ ] In Supabase mode, call the atomic facility RPC after the auth profile exists.
- [ ] Make `inviteStaff` accept only email and role; derive facility from the current profile.
- [ ] In local mode, create a local facility record owned by the new super admin and use it for staff invitations.

### Task 3: Simplify staff management around the owner facility

**Files:**
- Modify: `src/pages/StaffManagement.tsx`
- Modify: `src/components/Header.tsx`

- [ ] Display the current facility name and ID to the super admin.
- [ ] Remove the facility selector from the invitation form.
- [ ] Use the derived facility for all invitation and staff list operations.

### Task 4: Verify contracts

**Files:**
- No additional files unless verification identifies a defect.

- [ ] Run the migration in Supabase SQL Editor.
- [ ] Verify a super-admin profile has one facility ID and is the facility owner.
- [ ] Verify an invitation created by that owner has the same facility ID.
- [ ] Verify a second facility cannot be targeted by the frontend invitation flow.
- [ ] Run `npm run lint` and `npm run build`.
