import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, FileJson, LogIn, Upload, Wand2 } from "lucide-react";
import type { CurrentUser, Song } from "@songbook/shared";
import { can, sampleSongs } from "@songbook/shared";
import { analyzeYouTube, fetchCurrentUser, generateReading, upsertSong } from "../lib/api";

export function AdminPage() {
  const [idToken, setIdToken] = useState("");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<Partial<Song>>({ title: "", artist: "", tjNumber: "", status: "active", country: "일본" });
  const [youtubeUrl, setYoutubeUrl] = useState("");

  async function login() {
    try {
      const current = await fetchCurrentUser(idToken || "mock");
      setUser(current);
      setMessage(`${current.displayName} (${current.role})로 확인됐어.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인 실패");
    }
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
        <div className="inline-form">
          <input value={idToken} onChange={(event) => setIdToken(event.target.value)} placeholder="Google ID token 또는 mock" />
          <button type="button" className="primary-button" onClick={login}>
            <LogIn size={18} />
            확인
          </button>
        </div>
        {user ? <p>{user.displayName} · {user.role}</p> : <p>미인증 상태야.</p>}
      </section>

      <section className="admin-panel">
        <h2>곡 직접 추가/수정</h2>
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
        <div className="sheet-actions">
          <button type="button" className="secondary-button" disabled={!user} onClick={fillReading}>
            <Wand2 size={18} />
            독음 생성
          </button>
          <button type="button" className="primary-button" disabled={!user || !can(user.role, "song:create")} onClick={saveSong}>
            저장
          </button>
        </div>
      </section>

      <section className="admin-panel">
        <h2>YouTube 분석</h2>
        <div className="inline-form">
          <input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} placeholder="https://youtu.be/..." />
          <button type="button" className="secondary-button" disabled={!user} onClick={analyzeVideo}>
            분석
          </button>
        </div>
      </section>

      <section className="admin-panel">
        <h2>가져오기와 백업</h2>
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
        <p className="hint">이 버튼들은 API 계약과 권한 상태까지 연결되어 있고, 실제 파일 선택/다운로드는 다음 운영 바인딩에서 확장하면 돼.</p>
      </section>

      <section className="admin-panel">
        <h2>최근 변경</h2>
        <pre>{JSON.stringify(sampleSongs.slice(0, 1), null, 2)}</pre>
      </section>

      {message ? <div className="snackbar">{message}</div> : null}
    </main>
  );
}

