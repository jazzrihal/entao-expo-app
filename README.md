# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## CI and E2E

Pull requests run the iOS E2E workflow when app/build inputs, Maestro flows, or the iOS E2E workflow files change. The workflow compiles a release E2E iOS app on `macos-26` when source/build inputs changed or no reusable artifact exists; otherwise it reuses the latest matching `ios-e2e-app` artifact and runs Maestro against that build.

The E2E job resets the dedicated hosted Supabase test project from the backend migrations and seed data before running Maestro. If a build or E2E check fails, inspect the GitHub Actions logs, fix the failure, push the branch, and rerun until the relevant PR checks pass.

Local release E2E (macOS): `npm run build:e2e:ios` (installs a Release build with `EXPO_PUBLIC_SUPABASE_ENV=local`), then `npm run test:e2e` against a booted simulator. A local `supabase db reset` (backend repo) is required between full runs that mutate seed data. Prefer the Release binary over a development client — Maestro must exercise the embedded JS bundle, not Metro.

### Manual E2E (not covered by Maestro)

These flows were removed from `.maestro/` because they were still failing or unproven in local Release runs. Cover them by hand until the issues below are fixed and the flows can be restored:

| Manual check | What to verify | Follow-up issues |
| --- | --- | --- |
| **Delete own post** | From Profile, open a post you created → Delete → confirm → returned to the profile grid without that caption | iOS `Alert.alert` “Delete” collides with the toolbar trash a11y label; Maestro’s second `tapOn: "Delete"` often re-taps the toolbar and leaves “Delete post?” up. Prefer a unique confirm label/`testID`, or a relative tap (`below: "This cannot be undone."`). |
| **Swipe to unfriend** | Friends list → swipe Bob → Remove → Bob row gone | Mutates seed (removes Alice↔Bob). Was last in `flowsOrder` and never green in the interrupted local campaign; re-add only after a DB reset and keep it last. |

Related follow-ups (suite still automated, but brittle):

- **Sign-in / Passwords autofill** — After a fresh simulator or `db reset`, password can land in the wrong field or React state can disagree with the secure field. Dismiss via the “Welcome back” title (not `hideKeyboard`) before focusing password; `clearKeychain: true` helps Save Password sheets.
- **Sign-up Strong Password** — `autoComplete="new-password"` shows an iOS sheet invisible to XCUITest; type a single char, dismiss via the “Create account” title (`index: 0`), then enter the real password.
- **Cold post deep link (`entao://post/{id}` while signed out)** — Auth loading can clear the post pathname before `returnTo` is applied. App now remembers the linking URL in `src/lib/post-sharing.ts` / root layout; re-check if signed-out → sign-in still lands on post detail.
- **Pin badge a11y** — Nested badge `testID`s under `Pressable` are easy to lose on iOS; pin/unpin from Profile if Friends pager shows a stale Pin control.
- **Local vs Release install** — `expo run:ios --configuration Release` may still try to open the Expo dev-client URL after install; confirm `main.jsbundle` is present and Maestro `launchApp` hits the Release app, not Metro.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
