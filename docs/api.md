# API

Apps Script uses one endpoint with `action`.

## Response

```json
{
  "ok": true,
  "data": {},
  "error": null,
  "requestId": "uuid",
  "serverTime": "2026-07-01T00:00:00.000Z"
}
```

Errors keep the same shape with `ok: false` and `error.code`.

## Actions

- `GET action=publicData`
- `POST action=currentUser`
- `POST action=createPerformance`
- `POST action=upsertSong`
- `POST action=generateReading`
- `POST action=analyzeYouTube`
- `GET action=schema`

POST bodies are JSON sent as `text/plain;charset=utf-8` to fit Apps Script browser request constraints more reliably.

