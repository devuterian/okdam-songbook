# Songbook Apps Script

## Setup

1. Create a private Google Sheet.
2. Create an Apps Script project attached to that Sheet or standalone.
3. Copy `.clasp.json.example` to `.clasp.json` and set the real script id.
4. Set Script Properties:
   - `SPREADSHEET_ID`
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `ALLOWED_USERS_JSON`
   - `ALLOWED_ORIGINS`
   - `APP_ENV`
   - optional: `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `YOUTUBE_API_KEY`
5. Push with `clasp push`.
6. Run `setupSpreadsheet()` once from the Apps Script editor.
7. Deploy as Web App. Use "execute as me" and allow anyone with the deployment URL, because write authorization is enforced inside the script with Google ID tokens.

`ALLOWED_USERS_JSON` example:

```json
{
  "owner@example.com": { "displayName": "마리", "role": "owner" },
  "editor1@example.com": { "displayName": "성욱", "role": "editor" },
  "editor2@example.com": { "displayName": "여울", "role": "editor" }
}
```

Do not commit real emails or secrets.

