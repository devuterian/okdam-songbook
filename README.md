# Songbook

개인용 노래방 애창곡 관리 PWA입니다. GitHub Pages는 공개 정적 앱만 제공하고, 운영 데이터는 비공개 Google Sheets와 Apps Script Web App이 담당합니다.

## 주요 기능

- 모바일 중심 곡 검색: TJ 번호, 곡명, 아티스트, 일본어 원문, 한글 독음, 로마자, 장르, 메모
- 촘촘한 카드 목록과 곡 상세 Bottom Sheet
- 다크 모드, 접근성 포커스, 검색엔진 noindex
- PWA 설치, 서비스 워커, IndexedDB 캐시
- 오프라인 공연 기록 큐와 `clientRequestId` 중복 방지
- Google 로그인 기반 admin shell
- owner/editor 권한 모델
- Apps Script Sheet setup, public read, token verification, role-checked writes, ChangeLog
- CSV/JSON/AI/YouTube/Image 분석을 위한 안전한 API 경계와 수동 폴백

## 구조

```text
apps/web/        React + TypeScript + Vite PWA
apps-script/     Google Apps Script Web App source
packages/shared/ shared schemas, search, permissions, CSV key parsing
docs/            architecture, deployment, security, operations docs
records/         repo-template truth, decisions, research
```

## 로컬 실행

```bash
npm install
npm run dev
```

mock 모드는 기본값입니다. `apps/web/.env.example`을 참고해 `.env`를 만들 수 있습니다.

```bash
VITE_APP_BASE_PATH=/songbook/
VITE_ENABLE_MOCK_API=true
```

## 검증

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## GitHub Pages

GitHub repository settings에서 Pages source를 GitHub Actions로 설정합니다. Actions variables:

- `VITE_APPS_SCRIPT_API_URL`
- `VITE_GOOGLE_CLIENT_ID`

빌드는 `/songbook/` base path를 사용하고, `404.html` fallback을 생성해 `/songbook/admin/` 새로고침을 처리합니다.

## Google Sheets와 Apps Script

자세한 절차는 [deployment](docs/deployment.md)와 [apps-script README](apps-script/README.md)를 보세요.

Script Properties에는 실제 값을 넣습니다.

- `SPREADSHEET_ID`
- `GOOGLE_OAUTH_CLIENT_ID`
- `ALLOWED_USERS_JSON`
- `ALLOWED_ORIGINS`
- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_MODEL`
- `YOUTUBE_API_KEY`
- `APP_ENV`

실제 이메일과 비밀키는 저장소에 커밋하지 않습니다.

## 보안상 한계

`robots.txt`와 `noindex`는 검색 노출을 줄일 뿐 접근 통제가 아닙니다. 공개 앱과 공개 읽기 API URL을 아는 사람은 비삭제 공개 곡 목록을 볼 수 있습니다. 쓰기 권한은 Apps Script의 ID 토큰 검증과 allowlist가 최종 판단합니다.

