import type { Song } from "@songbook/shared";
import { highlightParts, primaryKey } from "@songbook/shared";
import { Heart } from "lucide-react";

interface SongCardProps {
  disabled?: boolean;
  song: Song;
  query: string;
  onOpen: (song: Song) => void;
  onFavoriteClick: (song: Song) => void;
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

export function SongCard({ disabled = false, song, query, onFavoriteClick, onOpen }: SongCardProps) {
  const keyLabel = primaryKey(song);
  const favorite = song.status === "favorite";
  const open = () => {
    if (!disabled) onOpen(song);
  };
  return (
    <article
      className="song-card"
      data-disabled={disabled ? "true" : undefined}
      data-physics-card
      data-song-id={song.id}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
    >
      <span className="tj-number">[{song.tjNumber || "----"}]</span>
      <span className="song-content">
        <span className="song-title-line">
          <strong>
            <Highlight text={song.title} query={query} />
          </strong>
          {song.titleReadingKo ? <span className="song-reading">{song.titleReadingKo}</span> : null}
        </span>
        <span className="song-artist-line">
          <span>
            <Highlight text={song.artist} query={query} />
          </span>
          {song.artistReadingKo ? <span className="song-reading">{song.artistReadingKo}</span> : null}
        </span>
      </span>
      <span className="song-card-actions">
        <button
          type="button"
          className="heart-button"
          aria-label={favorite ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}
          aria-pressed={favorite}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onFavoriteClick(song);
          }}
        >
          <Heart size={18} fill={favorite ? "currentColor" : "none"} />
        </button>
      </span>
      <span className="song-meta">
        {song.country ? <span>{song.country}</span> : null}
        {song.genres[0] ? <span>{song.genres[0]}</span> : null}
        {keyLabel ? <span>{keyLabel}</span> : null}
        {song.lastPerformedAt ? <span>최근 부름</span> : null}
      </span>
    </article>
  );
}
