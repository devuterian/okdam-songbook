import type { Song } from "@songbook/shared";
import { highlightParts, primaryKey } from "@songbook/shared";

interface SongCardProps {
  song: Song;
  query: string;
  onOpen: (song: Song) => void;
}

function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, index) => (
        <mark key={`${part.text}-${index}`} className={part.hit ? "hit" : undefined}>
          {part.text}
        </mark>
      ))}
    </>
  );
}

export function SongCard({ song, query, onOpen }: SongCardProps) {
  const keyLabel = primaryKey(song);
  return (
    <button type="button" className="song-card" onClick={() => onOpen(song)}>
      <span className="tj-number">{song.tjNumber || "번호 없음"}</span>
      <span className="song-main">
        <strong>
          <Highlight text={song.title} query={query} />
        </strong>
        <span>
          <Highlight text={song.artist} query={query} />
        </span>
      </span>
      <span className="song-meta">
        {song.country ? <span>{song.country}</span> : null}
        {keyLabel ? <span>{keyLabel}</span> : null}
        <span>{statusLabel(song.status)}</span>
        {song.lastPerformedAt ? <span>최근 부름</span> : null}
      </span>
    </button>
  );
}

function statusLabel(status: Song["status"]): string {
  const labels: Record<Song["status"], string> = {
    active: "활성",
    favorite: "애창",
    practicing: "연습",
    hold: "보류",
    deletion_candidate: "삭제 후보",
    deleted: "삭제됨"
  };
  return labels[status];
}

