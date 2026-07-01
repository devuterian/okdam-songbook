import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Filter, Moon, RotateCcw, Search, SlidersHorizontal, Sun } from "lucide-react";
import type { PerformerId, Song, SongFilters, SortKey } from "@songbook/shared";
import { filterSongs, performerOrder, performers, searchSongs, sortSongs } from "@songbook/shared";
import { BottomSheet } from "../components/BottomSheet";
import { SongCard } from "../components/SongCard";
import { SongDetail } from "../components/SongDetail";
import { cancelPerformance, createPerformance, fetchPublicData } from "../lib/api";
import { db, readCachedPublicData, saveCachedPublicData } from "../lib/db";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { usePhysicsMode } from "../hooks/usePhysicsMode";
import { useTheme } from "../hooks/useTheme";
import { AuthRequiredError, useAuth } from "../lib/auth/AuthContext";

export function PublicPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [query, setQuery] = useState(() => window.localStorage.getItem("songbook:query") ?? "");
  const [sortKey, setSortKey] = useState<SortKey>(() => (window.localStorage.getItem("songbook:sort") as SortKey | null) ?? "title");
  const [filters, setFilters] = useState<SongFilters>({});
  const [selected, setSelected] = useState<Song | null>(null);
  const [lastSync, setLastSync] = useState("");
  const [message, setMessage] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [physicsMode, setPhysicsMode] = useState(false);
  const [physicsResetId, setPhysicsResetId] = useState(0);
  const [theme, setTheme] = useTheme();
  const titleTapRef = useRef(0);
  const titleKeyRef = useRef(0);
  const titleToggleRef = useRef(0);
  const online = useOnlineStatus();
  const pendingPerformanceRef = useRef<{ songId: string; clientRequestId: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const cached = await readCachedPublicData();
      if (cached && !cancelled) {
        setSongs(cached.songs);
        setLastSync(cached.updatedAt);
      }
      try {
        const data = await fetchPublicData();
        if (!cancelled) {
          setSongs(data.songs);
          setLastSync(data.updatedAt);
          await saveCachedPublicData(data);
        }
      } catch (error) {
        if (!cached) setMessage(error instanceof Error ? error.message : "데이터를 불러오지 못했어.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("songbook:query", query);
    window.localStorage.setItem("songbook:sort", sortKey);
  }, [query, sortKey]);

  const visibleSongs = useMemo(() => {
    return sortSongs(searchSongs(filterSongs(songs, filters), query), sortKey);
  }, [filters, query, songs, sortKey]);

  const showMessage = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
  }, []);

  const exitPhysics = useCallback(() => {
    setPhysicsMode(false);
    setPhysicsResetId((version) => version + 1);
  }, []);

  usePhysicsMode({
    active: physicsMode,
    cardSelector: "[data-physics-card]",
    onExit: exitPhysics,
    onMessage: showMessage
  });

  const [lastPerformed, setLastPerformed] = useState<{ performanceId: string; clientRequestId: string; songId: string } | null>(null);

  const loginHint = useCallback(() => {
    setMessage("기록하려면 Google 로그인이 필요해. 관리 화면으로 이동할게.");
    window.setTimeout(() => navigate("/admin"), 800);
  }, [navigate]);

  async function performSong(song: Song, idToken: string) {
    const clientRequestId = crypto.randomUUID();
    const result = await createPerformance(song.id, idToken, clientRequestId);
    const performanceId = result && typeof result === "object" && "id" in result ? String((result as { id: string }).id) : "";
    setLastPerformed(performanceId ? { performanceId, clientRequestId, songId: song.id } : null);
    setMessage(performanceId ? "오늘 부른 곡으로 기록했어. 8초 안에 취소할 수 있어." : "오늘 부른 곡으로 기록했어.");
  }

  async function markPerformed(song: Song) {
    const clientRequestId = crypto.randomUUID();
    const optimistic = songs.map((item) =>
      item.id === song.id ? { ...item, performanceCount: item.performanceCount + 1, lastPerformedAt: new Date().toISOString() } : item
    );
    setSongs(optimistic);

    if (!online) {
      await db.queue.put({
        id: clientRequestId,
        action: "performance:create",
        songId: song.id,
        payload: { performedAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        status: "pending"
      });
      setMessage("오프라인이라 큐에 저장했어. 온라인 복귀 후 자동 동기화돼.");
      return;
    }

    try {
      const idToken = await auth.requireValidCredential();
      await performSong(song, idToken);
    } catch (error) {
      // Roll back the optimistic count if the write was never sent (auth fail).
      if (error instanceof AuthRequiredError) {
        setSongs((prev) => prev.map((item) =>
          item.id === song.id
            ? { ...item, performanceCount: Math.max(0, (item.performanceCount ?? 0) - 1), lastPerformedAt: item.lastPerformedAt }
            : item
        ));
        pendingPerformanceRef.current = { songId: song.id, clientRequestId };
        loginHint();
        return;
      }
      // Network/server error: queue offline so the user does not lose the record.
      await db.queue.put({
        id: clientRequestId,
        action: "performance:create",
        songId: song.id,
        payload: { performedAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "기록 실패"
      });
      setMessage("기록에 실패해서 큐에 저장했어.");
    }
  }

  async function undoLastPerformance() {
    const target = lastPerformed;
    if (!target) {
      setMessage("취소할 기록이 없어.");
      return;
    }
    setLastPerformed(null);
    setSongs((prev) => prev.map((item) =>
      item.id === target.songId
        ? { ...item, performanceCount: Math.max(0, (item.performanceCount ?? 0) - 1), lastPerformedAt: "" }
        : item
    ));
    if (!online) {
      await db.queue.put({
        id: crypto.randomUUID(),
        action: "performance:cancel",
        songId: target.songId,
        performanceId: target.performanceId,
        payload: { performanceId: target.performanceId },
        createdAt: new Date().toISOString(),
        status: "pending"
      });
      setMessage("오프라인이라 취소는 큐에 저장했어.");
      return;
    }
    try {
      const idToken = await auth.requireValidCredential();
      await cancelPerformance(target.performanceId, idToken, target.clientRequestId);
      setMessage("방금 기록한 곡을 취소했어.");
    } catch (error) {
      if (error instanceof AuthRequiredError) {
        setMessage("취소하려면 Google 로그인이 필요해.");
        return;
      }
      await db.queue.put({
        id: crypto.randomUUID(),
        action: "performance:cancel",
        songId: target.songId,
        performanceId: target.performanceId,
        payload: { performanceId: target.performanceId },
        createdAt: new Date().toISOString(),
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "취소 실패"
      });
      setMessage("취소에 실패해서 큐에 저장했어.");
    }
  }

  // Resume a pending performance record after the user finishes signing in.
  useEffect(() => {
    if (auth.status !== "authenticated") return;
    const pending = pendingPerformanceRef.current;
    if (!pending) return;
    pendingPerformanceRef.current = null;
    const song = songs.find((entry) => entry.id === pending.songId);
    if (!song) return;
    void (async () => {
      try {
        const idToken = await auth.requireValidCredential();
        await performSong(song, idToken);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "기록에 실패했어.");
      }
    })();
  }, [auth, auth.status, auth.forceUpdateToken, songs]);

  const countries = [...new Set(songs.map((song) => song.country).filter(Boolean))];
  const genres = [...new Set(songs.flatMap((song) => song.genres))];
  const activeFilters = [
    filters.country ? { key: "country" as const, label: filters.country } : null,
    filters.genre ? { key: "genre" as const, label: filters.genre } : null,
    ...(filters.performerIds ?? []).map((id) => ({ key: `performer:${id}` as const, label: `부를 사람: ${performers[id].displayName}` })),
    filters.hasKey ? { key: "hasKey" as const, label: "추천 키 있음" } : null,
    filters.favorite ? { key: "favorite" as const, label: "즐겨찾기" } : null,
    filters.practicing ? { key: "practicing" as const, label: "연습 중" } : null
  ].filter(Boolean) as Array<{ key: keyof SongFilters | `performer:${PerformerId}`; label: string }>;

  function togglePhysics() {
    titleToggleRef.current = window.performance.now();
    setSelected(null);
    setFilterOpen(false);
    if (physicsMode) setPhysicsResetId((version) => version + 1);
    setPhysicsMode(!physicsMode);
  }

  function onTitleTap() {
    const now = window.performance.now();
    if (now - titleTapRef.current < 560) {
      titleTapRef.current = 0;
      togglePhysics();
      return;
    }
    titleTapRef.current = now;
  }

  function onTitleKey(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter") return;
    const now = window.performance.now();
    if (now - titleKeyRef.current < 700) {
      titleKeyRef.current = 0;
      togglePhysics();
      return;
    }
    titleKeyRef.current = now;
  }

  function onTitleDoubleClick() {
    if (window.performance.now() - titleToggleRef.current > 220) togglePhysics();
  }

  function togglePerformerFilter(id: PerformerId) {
    setFilters((previous) => {
      const current = previous.performerIds ?? [];
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
      return { ...previous, performerIds: next.length ? next : undefined };
    });
  }

  function removeFilter(key: keyof SongFilters | `performer:${PerformerId}`) {
    if (key.startsWith("performer:")) {
      const id = key.replace("performer:", "") as PerformerId;
      setFilters((previous) => {
        const next = (previous.performerIds ?? []).filter((value) => value !== id);
        return { ...previous, performerIds: next.length ? next : undefined };
      });
      return;
    }
    setFilters((previous) => ({ ...previous, [key]: undefined }));
  }

  function handleFavorite(song: Song) {
    if (physicsMode) return;
    setMessage(song.status === "favorite" ? "즐겨찾기는 관리 화면에서 해제할 수 있어." : "즐겨찾기는 관리 화면에서 추가할 수 있어.");
  }

  const authLabel = auth.user
    ? `${auth.user.displayName} · ${auth.user.role}`
    : auth.displayInfo
      ? `${auth.displayInfo.displayName} · 다시 로그인 필요`
      : "비로그인";

  return (
    <main className="app-frame" data-physics-active={physicsMode ? "true" : undefined}>
      <header className="topbar">
        <div className="topline">
          <div>
            <h1
              className="brand-title"
              role="button"
              tabIndex={0}
              onClick={onTitleTap}
              onDoubleClick={onTitleDoubleClick}
              onKeyDown={onTitleKey}
            >
              Songbook
            </h1>
            <p>
              {online ? "온라인" : "오프라인"} · 마지막 동기화 {lastSync ? new Date(lastSync).toLocaleString() : "없음"}
              {" · "}
              <span data-testid="public-auth-state" className="auth-pill">{authLabel}</span>
            </p>
          </div>
          <div className="top-actions">
            <button
              type="button"
              className="icon-button theme-button"
              aria-label="테마 변경"
              onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")}
            >
              {theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <Link className="admin-link" to="/admin">
              관리
            </Link>
          </div>
        </div>
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="곡명, 아티스트, 독음, TJ 번호, 부를 사람" />
        </label>
        <div className="toolbar">
          <button type="button" onClick={() => setFilterOpen(true)}>
            <Filter size={17} />
            필터
          </button>
          <label>
            <SlidersHorizontal size={17} />
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
              <option value="title">가나다순</option>
              <option value="tjNumber">TJ 번호순</option>
              <option value="recentAdded">최근 추가순</option>
              <option value="recentUpdated">최근 수정순</option>
              <option value="recentPerformed">최근 부른 순</option>
              <option value="performanceCount">많이 부른 순</option>
            </select>
          </label>
        </div>
        {activeFilters.length ? (
          <div className="active-filters" aria-label="활성 필터">
            {activeFilters.map((filter) => (
              <button key={filter.key} type="button" onClick={() => removeFilter(filter.key)}>
                {filter.label} ×
              </button>
            ))}
            <button type="button" className="clear-filters" onClick={() => setFilters({})}>
              모두 초기화
            </button>
          </div>
        ) : null}
        <p className="result-count">{visibleSongs.length}곡</p>
      </header>

      {message ? (
        <div className="snackbar">
          <span>{message}</span>
          {lastPerformed ? (
            <button type="button" className="snackbar-action" onClick={() => void undoLastPerformance()}>
              취소
            </button>
          ) : null}
        </div>
      ) : null}
      <section className="song-list" aria-label="곡 목록">
        {visibleSongs.length > 0 ? (
          visibleSongs.map((song) => (
            <SongCard
              key={`${song.id}-${physicsResetId}`}
              disabled={physicsMode}
              song={song}
              query={query}
              onFavoriteClick={handleFavorite}
              onOpen={(nextSong) => {
                if (!physicsMode) setSelected(nextSong);
              }}
            />
          ))
        ) : (
          <div className="empty-state">{songs.length ? "검색 결과가 없어." : "아직 캐시된 곡이 없어. 한 번 온라인으로 동기화해줘."}</div>
        )}
      </section>

      {physicsMode ? (
        <button type="button" className="physics-restore" onClick={exitPhysics}>
          <RotateCcw size={16} />
          원상복구
        </button>
      ) : null}

      <BottomSheet open={Boolean(selected)} title={selected?.title ?? ""} onClose={() => setSelected(null)}>
        {selected ? <SongDetail song={selected} user={auth.user} onPerformed={markPerformed} /> : null}
      </BottomSheet>

      <BottomSheet open={filterOpen} title="필터" onClose={() => setFilterOpen(false)}>
        <div className="filter-form">
          <label className="field-row">
            <span>국가</span>
            <select value={filters.country ?? ""} onChange={(event) => setFilters((prev) => ({ ...prev, country: event.target.value || undefined }))}>
              <option value="">전체</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>
          <label className="field-row">
            <span>장르</span>
            <select value={filters.genre ?? ""} onChange={(event) => setFilters((prev) => ({ ...prev, genre: event.target.value || undefined }))}>
              <option value="">전체</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="filter-fieldset">
            <legend>부를 사람</legend>
            <div className="chip-toggle-group">
              {performerOrder.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="chip-toggle"
                  aria-pressed={Boolean(filters.performerIds?.includes(id))}
                  data-selected={filters.performerIds?.includes(id) ? "true" : undefined}
                  onClick={() => togglePerformerFilter(id)}
                >
                  {performers[id].displayName}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="checkbox-group">
            <label className="checkbox-row">
              <input type="checkbox" checked={Boolean(filters.hasKey)} onChange={(event) => setFilters((prev) => ({ ...prev, hasKey: event.target.checked || undefined }))} />
              <span>추천 키 있음</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={Boolean(filters.favorite)} onChange={(event) => setFilters((prev) => ({ ...prev, favorite: event.target.checked || undefined }))} />
              <span>즐겨찾기</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={Boolean(filters.practicing)} onChange={(event) => setFilters((prev) => ({ ...prev, practicing: event.target.checked || undefined }))} />
              <span>연습 중</span>
            </label>
          </div>
          <div className="filter-actions">
            <button type="button" className="secondary-button" onClick={() => setFilters({})}>
              초기화
            </button>
            <button type="button" className="primary-button" onClick={() => setFilterOpen(false)}>
              {visibleSongs.length}곡 보기
            </button>
          </div>
        </div>
      </BottomSheet>
    </main>
  );
}
