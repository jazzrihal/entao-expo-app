# Fill E2E coverage gaps: add friend, remove friend, delete post

Add three missing Maestro flows identified in a coverage review — add friend, remove friend, and delete post — and wire them into the suite's execution order.

## Todos

- [ ] Create `.maestro/friends/add-friend.yaml` (send + accept + cleanup)
- [ ] Create `.maestro/friends/remove-friend.yaml` (remove + restore)
- [ ] Create `.maestro/posts/delete-post.yaml` (create + delete)
- [ ] Add new flows to `.maestro/config.yaml` `flowsOrder`
- [ ] Start local Supabase, reset seed, build Release E2E iOS app
- [ ] Run new flows individually then full suite locally with Maestro CLI, iterating until green

## Background

A coverage review of `.maestro/` against the critical-flow checklist (Auth, Friends, Posts, Feeds) found the suite otherwise thorough, but three concrete gaps:

1. **Add friend** — no flow sends a friend request and gets it accepted (`friends/requests.yaml` only asserts a pre-seeded pending badge; `friends/search.yaml` stops at search results).
2. **Remove friend** — `handleRemoveFriend` / `useRemoveFriendMutation` in [src/components/friends/friends-list-tab.tsx](../../src/components/friends/friends-list-tab.tsx) is never exercised.
3. **Delete post** — the "Delete post?" confirm alert in [src/components/post-feed-pager.tsx](../../src/components/post-feed-pager.tsx) (`handleDelete`, line ~146) and `deletePost` in `src/lib/posts.ts` are untested.

Seed data (`entao-supabase-backend/supabase/seeds/01_users.sql`) gives: Alice↔Bob and Alice↔Charlie accepted friendships, Diana↔Bob accepted, Diana→Eve pending. **Diana has no relationship with Alice** (safe target for add-friend) and **Charlie is unused by any other `.maestro` flow** (safe target for remove-friend, since Bob is load-bearing for `friends/feed.yaml`, `friends/pin-badge.yaml`, `friends/open-profile-from-post.yaml`, and `profile/view-user-profile-post-detail.yaml`).

Both new friend flows restore seed state at the end so they can be re-run against a non-reset local DB, matching the existing cleanup style in `friends/pin-badge.yaml` and `moments/save-recall-delete.yaml`.

**Prior art / known pitfalls:** `git log` shows near-identical flows (`friends/swipe-unfriend.yaml`, `posts/delete-own-post.yaml`) existed before and were deliberately removed (commit `8d84b26`, "drop flaky coverage") because they weren't proven green locally. [README.md](../../README.md) documents why, and both fixes are folded into this plan:

- **Delete post**: the old flow did `tapOn: "Delete"` twice — once for the toolbar trash icon (`accessibilityLabel="Delete"`) and once for the native Alert's "Delete" button — and Maestro's a11y tree can match the toolbar button again for the second tap, leaving "Delete post?" stuck open. Fix: target the Alert button with a relative selector, e.g. `tapOn: { text: "Delete", below: "This cannot be undone." }`.
- **Remove friend**: the old flow swiped Bob (seed-load-bearing, see above) and was "never green in the interrupted local campaign" for unspecified reasons beyond the seed mutation. Using Charlie sidesteps the seed-mutation problem; the local verification pass (see Verification below) will catch any remaining swipe/timing issues before this is considered done.

## New flow 1: `.maestro/friends/add-friend.yaml`

Sign in as Alice → Friends → Search → search "diana" → tap `send-request-diana` → assert "Pending" text appears (search relationship auto-refetches via `invalidateFriendsQueries`). Switch accounts by re-running `../auth/sign-in.yaml` as `diana@example.com` (hardcode the password/email like `friends/requests.yaml` does for Eve, to avoid the CI job-level `E2E_EMAIL` override) → Friends → assert `incoming-request-alice-name` visible → tap `accept-request-alice` → assert `friend-row-alice` appears. Clean up: swipe `friend-row-alice` LEFT and tap "Remove" (mirrors the existing swipe-based `Remove`/`Delete` actions used in `friends-list-tab.tsx` and `moments/save-recall-delete.yaml`), assert it disappears — restoring the "none" relationship for reruns.

## New flow 2: `.maestro/friends/remove-friend.yaml`

Sign in as Alice → Friends → assert `friend-row-charlie` visible → swipe LEFT on it → tap "Remove" → assert `friend-row-charlie` no longer visible. Restore: Search → search "charlie" → tap `send-request-charlie` → assert "Pending" → switch accounts to `charlie@example.com` (hardcoded creds, same reasoning as flow 1) → Friends → assert `incoming-request-alice-name` → tap `accept-request-alice` → assert `friend-row-alice` visible (friendship restored).

## New flow 3: `.maestro/posts/delete-post.yaml`

Sign in as Alice → Home → capture + post a new photo via the camera flow (same steps as `posts/create-post.yaml`, unique caption e.g. `"Delete me - Maestro"`) → Profile → open the newest cell in `profile-post-grid` (reuse the existing `local-post-thumbnail` skip-when-visible pattern from `posts/view-post-detail.yaml` since local-only posts may exist from earlier flows) → assert `profile-post-detail-caption` shows the unique caption → tap the toolbar "Delete" button (`accessibilityLabel="Delete"`, trash icon) → assert the native "Delete post?" alert, tap "Delete" → assert we land back on `profile-post-grid` and the post/caption is gone.

## Wire into `.maestro/config.yaml`

Add to `flowsOrder` (order matters for the sequential planner):

- `add-friend` and `remove-friend` after `open-profile-from-post` (friends-tab flows) and before `save-recall-delete`. They touch disjoint users (Diana / Charlie) and both restore state, so their relative order doesn't matter.
- `delete-post` at the end, after `save-post-locally` (so it doesn't disturb the fixed post-index assumptions in earlier flows like `view-post-detail`).

Each new flow also needs its own `env` block (`E2E_EMAIL`/`E2E_PASSWORD` defaults for Alice, `${...}` overridable) matching the existing files, per the `.maestro` convention.

## Verification (local, on a Mac — not the cloud VM)

The PR and CI E2E run are handled separately by the developer; execution of this plan should instead verify locally with the Maestro CLI and a booted iOS Simulator, per `README.md`'s documented local flow:

1. Ensure prerequisites: local Supabase running (`supabase start` in `../entao-supabase-backend`) with a fresh `supabase db reset` (seed data must match what the flows assume), and `EXPO_PUBLIC_SUPABASE_ENV=local` wired via `.env` (already present per `.env.example`).
2. Build the Release E2E app once: `npm run build:e2e:ios` (installs into the booted Simulator; must be a Release build, not a dev client, since Maestro needs the embedded JS bundle).
3. Run each new flow individually first for fast iteration, e.g. `maestro test .maestro/friends/add-friend.yaml`, before running the full suite: `npm run test:e2e` (`maestro test .maestro/ --exclude-tags android`).
4. Because these flows mutate local seed data (friendships, posts) and the local DB is *not* auto-reset between runs (unlike CI), re-run `supabase db reset` (backend repo) between iterations if a flow fails partway and leaves state inconsistent (e.g. Diana/Charlie friendship not restored).
5. Iterate on flow YAML until `add-friend`, `remove-friend`, and `delete-post` are all green locally, then run the full ordered suite once end-to-end to confirm no regressions to existing flows.
6. Leave the branch uncommitted/unpushed for the developer to review, PR, and confirm on CI themselves — do not push or open a PR as part of this work.
