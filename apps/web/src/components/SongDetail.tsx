import type { Song } from "@songbook/shared";
import { can, primaryKey } from "@songbook/shared";
import { CalendarCheck, Edit3 } from "lucide-react";
import type { CurrentUser } from "@songbook/shared";

interface SongDetailProps {
  song: Song;
  user: CurrentUser | null;
  onPerformed: (song: Song) => void;
}

export function SongDetail({ song, user, onPerformed }: SongDetailProps) {
  return (
    <div className="detail-grid">
      <div>
        <span className="detail-label">TJ 번호</span>
        <strong>{song.tjNumber || "없음"}</strong>
      </div>
      <div>
        <span className="detail-label">추천 키</span>
        <strong>{primaryKey(song) || "미입력"}</strong>
      </div>
      <div>
        <span className="detail-label">곡명 독음</span>
        <span>{song.titleReadingKo || "미입력"}</span>
      </div>
      <div>
        <span className="detail-label">아티스트 독음</span>
        <span>{song.artistReadingKo || "미입력"}</span>
      </div>
      <div>
        <span className="detail-label">장르</span>
        <span>{song.genres.join(", ") || "미입력"}</span>
      </div>
      <div>
        <span className="detail-label">원작</span>
        <span>{song.originalWork || "미입력"}</span>
      </div>
      <div className="detail-wide">
        <span className="detail-label">메모</span>
        <p>{song.memo || "메모 없음"}</p>
      </div>
      <div className="detail-wide">
        <span className="detail-label">최근 기록</span>
        <p>
          마지막 {song.lastPerformedAt ? new Date(song.lastPerformedAt).toLocaleString() : "없음"} · 총 {song.performanceCount}회
        </p>
      </div>
      <div className="sheet-actions">
        <button type="button" className="primary-button" onClick={() => onPerformed(song)}>
          <CalendarCheck size={18} />
          오늘 불렀습니다!
        </button>
        <button type="button" className="secondary-button" disabled={!can(user?.role, "song:update")}>
          <Edit3 size={18} />
          수정
        </button>
      </div>
    </div>
  );
}

