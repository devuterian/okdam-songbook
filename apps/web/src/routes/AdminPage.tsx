import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { Download, FileJson, Image, ListMusic, LogIn, Upload, Wand2, Youtube } from "lucide-react";
import type { CurrentUser, Song } from "@songbook/shared";
import { can, sampleSongs } from "@songbook/shared";
import { analyzeYouTube, fetchCurrentUser, generateReading, upsertSong } from "../lib/api";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const googleScriptSrc = "https://accounts.google.com/gsi/client";

type GoogleCredentialResponse = {
  credential?: string;
};

type AdminTab = "add" | "songs" | "history" | "settings";

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: "add", label: "곡 추가" },
  { id: "songs", label: "곡 관리" },
  { id: "history", label: "변경 이력" },
  { id: "settings", label: "고급 설정" }
];

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
          renderButton(parent: HTMLElement, options: { theme: "outline"; size: "large"; type: "standard"; shape: "rectangular"; text: "signin_with"; width: number }): void;
        };
      };
    };
  }
}

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts.id) return Promise.resolve();

  const existingScript = Array.from(document.scripts).find((script) => script.src === googleScriptSrc);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google 로그인 스크립트를 불러오지 못했어.")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = googleScriptSrc;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Google 로그인 스크립트를 불러오지 못했어.")), { once: true });
    document.head.append(script);
  });
}

export function AdminPage() {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") as AdminTab | null;
  const activeTab: AdminTab = requestedTab && tabs.some((tab) => tab.id === requestedTab) ? requestedTab : "add";
  const [idToken, setIdToken] = useState("");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<Partial<Song>>({ title: "", artist: "", tjNumber: "", status: "active", country: "일본" });
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const loginWithToken = useCallback(async (token: string) => {
    try {
      setIdToken(token);
      const current = await fetchCurrentUser(token);
      setUser(current);
      setMessage(`${current.displayName} (${current.role})로 확인됐어.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인 실패");
    }
  }, []);

  useEffect(() => {
    if (!googleClientId) return;

    let cancelled = false;
    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google?.accounts.id || !googleButtonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response.credential) void loginWithToken(response.credential);
            else setMessage("Google 로그인 토큰을 받지 못했어.");
          }
        });
        googleButtonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: "signin_with",
          width: 280
        });
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : "Google 로그인 초기화 실패");
      });

    return () => {
      cancelled = true;
    };
  }, [loginWithToken]);

  async function login() {
    await loginWithToken(idToken || "mock");
  }

  async function saveSong() {
    if (!user || !can(user.role, "song:create")) return;
    const saved = await upsertSong(draft, idToken || "mock", crypto.randomUUID());
    setDraft(saved);
    setMessage("저장했어. editor 곡도 즉시 공개 목록에 반영돼.");
  }

  async function fillReading() {
    if (!user) return;
    const reading = await generateReading({ title: draft.title ?? "", artist: draft.artist ?? "" }, idToken || "mock");
    setDraft((prev) => ({ ...prev, ...reading }));
    setMessage("독음 후보를 채웠어. 저장 전에 수정할 수 있어.");
  }

  async function analyzeVideo() {
    if (!user) return;
    const result = await analyzeYouTube(youtubeUrl, idToken || "mock");
    setDraft((prev) => ({ ...prev, ...result }));
    setMessage("YouTube 분석 후보를 불러왔어. 자동 저장은 하지 않았어.");
  }

  return (
    <main className="admin-frame">
      <header className="admin-header">
        <div>
          <h1>Songbook 관리</h1>
          <p>Google 로그인 토큰은 서버에서 다시 검증돼. mock 모드는 로컬 확인용이야.</p>
        </div>
        <Link className="admin-link" to="/">
          공개 화면
        </Link>
      </header>

      <section className="admin-panel">
        <h2>로그인</h2>
        {googleClientId ? (
          <div className="google-login-row" ref={googleButtonRef} />
        ) : (
          <p className="hint">VITE_GOOGLE_CLIENT_ID가 없어서 수동 토큰/mock 로그인만 사용할 수 있어.</p>
        )}
        <div className="inline-form">
          <input value={idToken} onChange={(event) => setIdToken(event.target.value)} placeholder="Google ID token 또는 mock" />
          <button type="button" className="primary-button" onClick={login}>
            <LogIn size={18} />
            확인
          </button>
        </div>
        {user ? <p>{user.displayName} · {user.role}</p> : <p>미인증 상태야.</p>}
      </section>

      <nav className="admin-tabs" aria-label="관리 탭">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => setSearchParams(tab.id === "add" ? {} : { tab: tab.id })}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "add" ? (
        <section className="admin-panel admin-form-panel">
          <header className="panel-heading">
            <h2>곡 추가</h2>
            <div className="panel-tools">
              <button type="button" className="secondary-button" disabled={!user} onClick={analyzeVideo}>
                <Youtube size={17} />
                YouTube
              </button>
              <button type="button" className="secondary-button" disabled>
                <Image size={17} />
                이미지
              </button>
            </div>
          </header>
          <div className="inline-form import-row">
            <input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} placeholder="https://youtu.be/... 후보 가져오기" />
          </div>
          <div className="form-grid">
            <label>
              TJ 번호
              <input value={draft.tjNumber ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, tjNumber: event.target.value }))} />
            </label>
            <label>
              곡명
              <input required value={draft.title ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} />
            </label>
            <label>
              곡명 독음
              <input value={draft.titleReadingKo ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, titleReadingKo: event.target.value }))} />
            </label>
            <label>
              아티스트
              <input required value={draft.artist ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, artist: event.target.value }))} />
            </label>
            <label>
              아티스트 독음
              <input value={draft.artistReadingKo ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, artistReadingKo: event.target.value }))} />
            </label>
            <label>
              국가
              <input value={draft.country ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, country: event.target.value }))} />
            </label>
            <label className="form-wide">
              메모
              <textarea value={draft.memo ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, memo: event.target.value }))} />
            </label>
          </div>
          <div className="admin-action-bar">
            <button type="button" className="secondary-button" onClick={() => setDraft({ title: "", artist: "", tjNumber: "", status: "active", country: "일본" })}>
              취소
            </button>
            <span />
            <button type="button" className="secondary-button" disabled={!user} onClick={fillReading}>
              <Wand2 size={18} />
              독음 생성
            </button>
            <button type="button" className="primary-button" disabled={!user || !can(user.role, "song:create")} onClick={saveSong}>
              저장
            </button>
          </div>
        </section>
      ) : null}

      {activeTab === "songs" ? (
        <section className="admin-panel">
          <h2>곡 관리</h2>
          <div className="admin-song-list">
            {sampleSongs.map((song) => (
              <div key={song.id} className="admin-song-row">
                <ListMusic size={18} />
                <span>{song.tjNumber || "번호 없음"}</span>
                <strong>{song.title}</strong>
                <small>{song.artist}</small>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "history" ? (
        <section className="admin-panel">
          <h2>변경 이력</h2>
          <pre>{JSON.stringify(sampleSongs.slice(0, 1), null, 2)}</pre>
        </section>
      ) : null}

      {activeTab === "settings" ? (
        <section className="admin-panel">
          <h2>고급 설정</h2>
          <div className="ops-grid">
            <button type="button" disabled={!user || !can(user.role, "csv:import")}>
              <Upload size={18} />
              CSV 가져오기
            </button>
            <button type="button" disabled={!user || !can(user.role, "csv:export")}>
              <Download size={18} />
              CSV 내보내기
            </button>
            <button type="button" disabled={!user || !can(user.role, "backup:json")}>
              <FileJson size={18} />
              JSON 백업
            </button>
          </div>
          <p className="hint">서버 설정 상태, 동기화 진단, PWA 캐시 초기화는 Apps Script 연결 뒤 확장하면 돼.</p>
        </section>
      ) : null}

      {message ? <div className="snackbar">{message}</div> : null}
    </main>
  );
}
