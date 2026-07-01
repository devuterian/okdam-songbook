# ChatGPT Action Setup (2026-07-01)

Google OAuth + Cloudflare Worker + Apps Script + Custom GPT Action 5단계.

## Step 1 — Google Cloud OAuth client (5분)

1. Google Cloud Console → 기존 `okdam-songbook` 프로젝트 → APIs & Services → Credentials.
2. "Create credentials" → "OAuth client ID" → Application type: **Web application**.
3. Name: `Songbook ChatGPT Proxy`.
4. **Authorized redirect URIs** (정확히 한 줄):
   `https://songbook-chatgpt-proxy.iam-marierie.workers.dev/oauth/callback`
   (/oauth/callback은 Google → Worker 콜백 전용.)
   (참고: ChatGPT의 redirect URL `https://chatgpt.com/aip/<GPT_ID>/oauth/callback`은 Google이 아니라 Worker가 검증한다. 두 URL을 혼동하지 말 것.)
5. Client ID, Client Secret을 안전한 곳에 복사 (둘 다 secret).

## Step 2 — Worker secret 및 이메일 3개 등록 (5분)

먼저 **Custom GPT가 사용할 OAuth client id/secret**을 새로 만든다 (이건 Google이 아니라 Worker가 발급·검증). 운영자가 임의의 32-byte hex 두 개를 생성:

```bash
openssl rand -hex 32  # GPT_OAUTH_CLIENT_ID
openssl rand -hex 32  # GPT_OAUTH_CLIENT_SECRET
```

Cloudflare Dashboard → Workers & Pages → 새 Worker (또는 `wrangler` CLI):

```bash
cd integrations/chatgpt-proxy
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put APPS_SCRIPT_URL            # https://script.google.com/macros/s/.../exec
wrangler secret put INTERNAL_PROXY_SECRET      # openssl rand -hex 32
wrangler secret put COOKIE_SECRET              # openssl rand -hex 32
wrangler secret put MARIE_EMAIL                # 실제 값은 커밋하지 않음
wrangler secret put SEONGWOOK_EMAIL            # 실제 값은 커밋하지 않음
wrangler secret put YEOWOOL_EMAIL              # 실제 값은 커밋하지 않음
wrangler secret put GPT_OAUTH_CLIENT_ID        # 위에서 생성
wrangler secret put GPT_OAUTH_CLIENT_SECRET    # 위에서 생성
```

`wrangler.toml`의 `CALLBACK_BASE_URL`은 현재 실제 Worker URL이다:

- `https://songbook-chatgpt-proxy.iam-marierie.workers.dev`

Custom GPT 생성 후 `CHATGPT_REDIRECT_URI_ALLOWLIST`에 ChatGPT 콜백 URL을 추가:

- `https://chatgpt.com/aip/<GPT_ID>/oauth/callback`
- `https://chat.openai.com/aip/<GPT_ID>/oauth/callback` (옵션)

`<GPT_ID>`는 Custom GPT 생성 후 URL에 나타난다.
Preview 로그인 카드에서 실제로 전달되는 callback ID가 GPT URL의 ID와 다를 수 있다. `/authorize?...redirect_uri=...` 값에 보이는 `https://chatgpt.com/aip/.../oauth/callback` 또는 `https://chat.openai.com/aip/.../oauth/callback`도 allowlist에 추가한다.

## Step 3 — Worker 배포 (3분)

```bash
cd integrations/chatgpt-proxy
npm install
wrangler deploy
```

배포가 끝나면 `/healthz`가 200을 반환하고 `/authorize`가 Google OAuth로 302 redirect 되는지 확인한다. Google Cloud Redirect URI는 Step 1의 URL과 같아야 한다.

## Step 4 — Apps Script 새 버전 배포 (2분)

1. Apps Script editor → Project Settings → Script properties에 다음을 추가/갱신:
   - `INTERNAL_PROXY_SECRET` (Step 2의 값과 동일)
   - `CHATGPT_ALLOWED_USERS_JSON`:
     ```json
     {
       "<MARIE_EMAIL>":    { "displayName": "마리",   "role": "owner" },
       "<SEONGWOOK_EMAIL>": { "displayName": "성욱",   "role": "editor" },
       "<YEOWOOL_EMAIL>":   { "displayName": "여울",   "role": "editor" }
     }
     ```
   - 기존 `CHATGPT_ACTION_SECRET` (이전 단계의 body apiKey)는 더 이상 사용하지 않지만, 남아 있어도 무시된다. 비워두거나 그대로 둬도 무관.
2. Deploy → Manage deployments → 새 버전 → Deploy.
3. `/exec` URL이 바뀌지 않는지 확인. 바뀌면 `apps/web/.github`의 `VITE_APPS_SCRIPT_API_URL`도 새 URL로 갱신 후 Pages 재배포.

## Step 5 — Custom GPT OAuth 및 링크 공유 (5분)

1. https://chatgpt.com/gpts/editor → Create.
2. Instructions에 [docs/chatgpt-gpt-instructions.md](/docs/chatgpt-gpt-instructions.md)를 붙여넣는다.
3. Actions → "Create new action" → Schema에 [docs/chatgpt-action-openapi.yaml](/docs/chatgpt-action-openapi.yaml) 내용을 붙여넣는다.
4. Authentication → "OAuth" → "Add new" → "Custom" (또는 "OAuth2") 두 가지 모드 모두 OK.
   - **Authorization URL**: `https://songbook-chatgpt-proxy.iam-marierie.workers.dev/authorize`
   - **Token URL**: `https://songbook-chatgpt-proxy.iam-marierie.workers.dev/token`
   - Scopes: `openid email profile`
   - **Client ID**: Step 2의 `GPT_OAUTH_CLIENT_ID`
   - **Client Secret**: Step 2의 `GPT_OAUTH_CLIENT_SECRET`
   - **Authorization URL** 의 redirect_uri 파라미터로 ChatGPT가 `https://chatgpt.com/aip/<GPT_ID>/oauth/callback`을 보낸다. Worker는 allowlist로 검증한다.
5. Privacy: "Send data to this action" 체크.
6. "Who can edit" → Only me. "Publish to" → **"Only people with the link"** (절대 GPT Store에 공개하지 않는다).
7. Test: Preview에서 곡 1건 추가 흐름이 끝까지 도는지 확인. Apps Script 실행 내역에서 allowlisted actor email이 ChangeLog에 남는지 확인.

## 5단계 요약

| # | 무엇 | 어디서 |
| --- | --- | --- |
| 1 | OAuth client + redirect URI | Google Cloud Console |
| 2 | Worker secret 8개 | Cloudflare Dashboard / wrangler |
| 3 | Worker 배포 | `wrangler deploy` |
| 4 | Apps Script Script Property + 새 버전 | Apps Script editor |
| 5 | Custom GPT OAuth + 링크 공유 | chat.openai.com |

## 개인 페이지

- GitHub Pages: <https://devuterian.github.io/okdam-songbook/privacy/>
- ChatGPT 사용자에게 안내해 줄 수 있다.

## 현재 운영 값

- Worker URL: <https://songbook-chatgpt-proxy.iam-marierie.workers.dev>
- GPT URL: <https://chatgpt.com/g/g-6a451de53b6c819196b0060d51bbe18e-okdam-songbook-assistant>
- Google Cloud Redirect URI: `https://songbook-chatgpt-proxy.iam-marierie.workers.dev/oauth/callback`
- GPT Authorization URL: `https://songbook-chatgpt-proxy.iam-marierie.workers.dev/authorize`
- GPT Token URL: `https://songbook-chatgpt-proxy.iam-marierie.workers.dev/token`
