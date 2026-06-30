# Deployment

## GitHub Pages

1. Push to `main`.
2. In GitHub repository settings, set Pages source to GitHub Actions.
3. Set Actions variables:
   - `VITE_APPS_SCRIPT_API_URL`
   - `VITE_GOOGLE_CLIENT_ID`
4. Run the `Deploy GitHub Pages` workflow.

The workflow runs lint, typecheck, tests, and build before deploying `apps/web/dist`.

## Google OAuth

1. Create an OAuth client for a web application in Google Cloud.
2. Add authorized JavaScript origins for local development and GitHub Pages.
3. Put the client ID in frontend env and Apps Script `GOOGLE_OAUTH_CLIENT_ID`.

## Apps Script

1. Create or pick a private Google Sheet.
2. Create Apps Script project.
3. Configure `.clasp.json`.
4. Set Script Properties from `apps-script/README.md`.
5. `clasp push`.
6. Run `setupSpreadsheet()`.
7. Deploy Web App and copy deployment URL to `VITE_APPS_SCRIPT_API_URL`.

