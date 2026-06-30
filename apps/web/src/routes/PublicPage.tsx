import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Moon, Search, SlidersHorizontal, Sun } from "lucide-react";
import type { CurrentUser, Song, SongFilters, SortKey } from "@songbook/shared";
import { filterSongs, searchSongs, sortSongs } from "@songbook/shared";
import { BottomSheet } from "../components/BottomSheet";
import { SongCard } from "../components/SongCard";
import { SongDetail } from "../components/SongDetail";
import { createPerformance, fetchPublicData } from "../lib/api";
import { db, readCachedPublicData, saveCachedPublicData } from "../lib/db";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useTheme } from "../hooks/useTheme";

export function PublicPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [query, setQuery] = useState(() => window.localStorage.getItem("songbook:query") ?? "");
  const [sortKey, setSortKey] = useState<SortKey>(() => (window.localStorage.getItem("songbook:sort") as SortKey | null) ?? "title");
  const [filters, setFilters] = useState<SongFilters>({});
  const [selected, setSelected] = useState<Song | null>(null);
  const [lastSync, setLastSync] = useState("");
  const [message, setMessage] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const online = useOnlineStatus();
  const user: CurrentUser | null = null;

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

  async function markPerformed(song: Song) {
    const clientRequestId = crypto.randomUUID();
    const optimistic = songs.map((item) =>
      item.id === song.id ? { ...item, performanceCount: item.performanceCount + 1, lastPerformedAt: new Date().toISOString() } : item
    );
    setSongs(optimistic);
    setMessage("오늘 부른 곡으로 기록했어. 8초 안에 큐에서 취소할 수 있어.");
    if (!online) {
      await db.queue.put({
        id: clientRequestId,
        action: "performance:create",
        songId: song.id,
        payload: { performedAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        status: "pending"
      });
      return;
    }
    try {
      await createPerformance(song.id, null, clientRequestId);
    } catch (error) {
      await db.queue.put({
        id: clientRequestId,
        action: "performance:create",
        songId: song.id,
        payload: { performedAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "기록 실패"
      });
    }
  }

  const countries = [...new Set(songs.map((song) => song.country).filter(Boolean))];
  const genres = [...new Set(songs.flatMap((song) => song.genres))];

  return (
    <main className="app-frame">
      <header className="topbar">
        <div className="topline">
          <div>
            <h1>Songbook</h1>
            <p>{online ? "온라인" : "오프라인"} · 마지막 동기화 {lastSync ? new Date(lastSync).toLocaleString() : "없음"}</p>
          </div>
          <Link className="admin-link" to="/admin">
            관리
          </Link>
        </div>
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="곡명, 아티스트, 독음, TJ 번호" />
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
          <button type="button" aria-label="테마 변경" onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")}>
            {theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
            {theme}
          </button>
        </div>
        <p className="result-count">{visibleSongs.length}곡</p>
      </header>

      {message ? <div className="snackbar">{message}</div> : null}
      <section className="song-list" aria-label="곡 목록">
        {visibleSongs.length > 0 ? (
          visibleSongs.map((song) => <SongCard key={song.id} song={song} query={query} onOpen={setSelected} />)
        ) : (
          <div className="empty-state">{songs.length ? "검색 결과가 없어." : "아직 캐시된 곡이 없어. 한 번 온라인으로 동기화해줘."}</div>
        )}
      </section>

      <BottomSheet open={Boolean(selected)} title={selected?.title ?? ""} onClose={() => setSelected(null)}>
        {selected ? <SongDetail song={selected} user={user} onPerformed={markPerformed} /> : null}
      </BottomSheet>

      <BottomSheet open={filterOpen} title="필터" onClose={() => setFilterOpen(false)}>
        <div className="filter-grid">
          <label>
            국가
            <select value={filters.country ?? ""} onChange={(event) => setFilters((prev) => ({ ...prev, country: event.target.value || undefined }))}>
              <option value="">전체</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>
          <label>
            장르
            <select value={filters.genre ?? ""} onChange={(event) => setFilters((prev) => ({ ...prev, genre: event.target.value || undefined }))}>
              <option value="">전체</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>
          <label>
            <input type="checkbox" checked={Boolean(filters.hasKey)} onChange={(event) => setFilters((prev) => ({ ...prev, hasKey: event.target.checked || undefined }))} />
            추천 키 있음
          </label>
          <label>
            <input type="checkbox" checked={Boolean(filters.favorite)} onChange={(event) => setFilters((prev) => ({ ...prev, favorite: event.target.checked || undefined }))} />
            애창곡
          </label>
          <label>
            <input type="checkbox" checked={Boolean(filters.practicing)} onChange={(event) => setFilters((prev) => ({ ...prev, practicing: event.target.checked || undefined }))} />
            연습 중
          </label>
        </div>
      </BottomSheet>
    </main>
  );
}
