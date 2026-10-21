# Então iOS requirements

This is what the iOS app does today, for one signed-in person. This repo is the client. Auth and data are in Supabase.

When behavior changes, edit the matching requirement in the same change.

Not covered: Android, web, tools for reviewing reports, and who can see a post (that stays in the backend).

## Account

- A1. Sign up and sign in with email and password. Sign in with Apple. Sign out from Settings.
- A2. The current terms at `https://entao.link/terms` must be accepted before the app can be used.
- A3. Settings edits username, display name, and date of birth. Email is shown and is not edited.
- A4. Delete account schedules permanent deletion after 30 days. It can be cancelled until then.

## Posts

- P1. Capture a photo, with an optional caption (500 characters) and an optional location. Privacy is Friends by default, or Public or Private.
- P2. Home shows the feed. Friends shows posts grouped by person. Profile shows your own grid.
- P3. Open a post. Like or unlike it. Edit or delete your own. Pin or unpin a post for yourself.
- P4. A new post can stay on the device and upload later, including in the background. A previously loaded friends feed, profile grid, and profile can be shown offline.
- P5. Share `https://entao.link/post/{id}`. Opening `entao://post/{id}` or `entao://user/{username}` goes to that post or profile, including after sign-in.

## Moments

- M1. Save, list, and delete a moment: a time and a place, with an optional address.

## Friends

- F1. Search people. Send, accept, decline, or cancel a request. Remove a friend. At most 150 friends.
- F2. Open another person’s profile from a post or the friends list.

## Safety

- S1. Report a post or a profile with one fixed reason and optional details (1000 characters). Reporting the same target again is rejected.
- S2. Block a user and unblock them later.

## Notifications

- N1. With permission, register for push. Tapping a notification opens the related post, profile, or friends list.

## Constraints

- Portrait only.
