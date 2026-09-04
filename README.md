# Project Tracker

Live: https://project-tracker-837f9.web.app

Firebase project: `project-tracker-837f9` (Spark). Hosting, email/password Authentication and Firestore are configured without a billing upgrade. Source belongs to Omar-Khattab-01.

## Data model and privacy

Each signed-in user owns `workspaces/{uid}`. Firestore rules enforce ownership, reject anonymous access and validate the document envelope. Writes use transactions so changes are applied to the latest cloud state. Sign-out removes the workspace from the UI. No old browser data is uploaded automatically.

Users can create an empty portfolio or explicitly load generic examples. Accounts are isolated: this version does not support invitations or shared team projects. Each workspace is stored in one document, with an application limit of 850 KB of serialized projects. This is suitable for small portfolios; split projects/tasks into separate documents before larger-scale use. Use Export backup to download your data.

## Develop and deploy

Use Node 24 and pnpm 11.19.0. Run `pnpm install`, then `pnpm dev`. The default build targets the GitHub Pages repository path. Build for Firebase with `DEPLOY_TARGET=firebase pnpm build`, then `firebase deploy --only hosting,firestore:rules --project project-tracker-837f9` after `firebase login`.

`node scripts/test-firebase.mjs` creates two temporary test accounts, checks persistence and cross-account/anonymous denials against the live database, then removes only those test accounts and their test document. Do not run this against another Firebase project.

Firebase web configuration is public, not an administrative credential. Never commit CLI tokens, OAuth codes, service-account keys or passwords. Firebase Hosting deployments currently run from the authenticated CLI; GitHub Pages continues using its existing workflow.

The Spark plan is quota-limited. No paid services, Cloud Functions, file storage or automatic billing upgrade are configured. It is not an unlimited-service guarantee.
