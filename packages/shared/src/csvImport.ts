import { parseCsvKey } from "./key";
import type { KeyCandidate, Song } from "./schemas";

const GENRE_BY_COUNTRY: Record<string, string> = {
  "한국": "K-POP",
  "일본": "J-POP",
  "미국": "POP",
  "아니메": "애니메이션"
};

export interface CsvRowInput {
  title?: string;
  tjNumber?: string;
  createdAt?: string;
  artist?: string;
  originalWork?: string;
  country?: string;
  recommender?: string;
  key?: string;
  genres?: string;
  memo?: string;
}

export interface ImportedSong extends Song {
  _warnings: string[];
  _source: {
    csv: string;
    rowIndex: number;
    raw: CsvRowInput;
  };
}

export interface CsvImportReport {
  totalRows: number;
  inserted: number;
  skipped: number;
  warnings: number;
  songs: ImportedSong[];
  skippedRows: Array<{ rowIndex: number; reason: string; raw: CsvRowInput }>;
  warningRows: Array<{ rowIndex: number; reason: string; raw: CsvRowInput }>;
}

export interface CsvImportOptions {
  csvFileName: string;
  generatedAt?: string;
  idFactory?: () => string;
  keyIdFactory?: () => string;
}

const KOREAN_DATE_RE = /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일(?:\s*오전|오후)?\s*(\d{1,2}):(\d{2})/;

function toIsoFromKoreanDate(value: string | undefined, generatedAt: string): string {
  if (!value) return generatedAt;
  const match = value.match(KOREAN_DATE_RE);
  if (!match) return generatedAt;
  const [, year, month, day, hour, minute] = match;
  const isAfternoon = /오후/.test(value);
  let h = Number(hour);
  if (isAfternoon) {
    h = h === 12 ? 12 : h + 12;
  } else if (h === 12) {
    h = 0;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(Number(month))}-${pad(Number(day))}T${pad(h)}:${pad(Number(minute))}:00+09:00`;
}

function normalizeKeyCandidates(raw: string, keyIdFactory: () => string): { candidates: KeyCandidate[]; warnings: string[] } {
  if (!raw) return { candidates: [], warnings: [] };
  const parsed = parseCsvKey(raw, keyIdFactory);
  return { candidates: parsed.candidates, warnings: parsed.warnings };
}

function buildMemo(row: CsvRowInput, keyWarnings: string[]): string {
  const parts: string[] = [];
  if (row.recommender) parts.push(`추천인 ${row.recommender}`);
  if (row.originalWork) parts.push(`원작 ${row.originalWork}`);
  if (row.key && /[?？~～/]/.test(row.key)) {
    parts.push(`키 모호(${row.key}) - 원본 확인 필요`);
}
  parts.push(...keyWarnings);
  return parts.join(" | ");
}

function buildSourceReference(csvFileName: string, recommender?: string): string {
  return recommender ? `${csvFileName}:${recommender}` : csvFileName;
}

export function csvRowToSong(row: CsvRowInput, rowIndex: number, options: CsvImportOptions): ImportedSong {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const idFactory = options.idFactory ?? (() => crypto.randomUUID());
  const keyIdFactory = options.keyIdFactory ?? idFactory;

  const title = String(row.title || "").trim();
  const artist = String(row.artist || "").trim();
  const recommender = String(row.recommender || "").trim();
  const country = String(row.country || "").trim();
  const originalWork = String(row.originalWork || "").trim();
  const tjNumber = String(row.tjNumber || "").trim();

  const { candidates: keyCandidates, warnings: keyWarnings } = normalizeKeyCandidates(row.key || "", keyIdFactory);
  const warnings = [...keyWarnings];

  if (!title) warnings.push(`곡명이 비어있어 (행 ${rowIndex + 1})`);
  if (!artist) warnings.push(`아티스트가 비어있어 (행 ${rowIndex + 1})`);

  const countryGenre = country && GENRE_BY_COUNTRY[country] ? GENRE_BY_COUNTRY[country] : "";
  const genres = Array.from(new Set([countryGenre, ...(row.genres ? [row.genres] : [])].filter(Boolean)));

  const createdAt = toIsoFromKoreanDate(row.createdAt, generatedAt);
  const createdByName = recommender;

  const song: ImportedSong = {
    id: idFactory(),
    tjNumber,
    title,
    titleReadingKo: "",
    titleRomanized: "",
    titleAliases: [],
    artist,
    artistReadingKo: "",
    artistAliases: [],
    country,
    genres,
    originalWork,
    keyCandidates,
    memo: buildMemo(row, keyWarnings),
    status: "active",
    youtubeUrl: "",
    youtubeVideoId: "",
    isOfficialTjVideo: null,
    sourceType: "csv",
    sourceReference: buildSourceReference(options.csvFileName, recommender),
    createdByName,
    createdAt,
    updatedByName: createdByName,
    updatedAt: createdAt,
    deletedAt: "",
    version: 1,
    lastPerformedAt: "",
    performanceCount: 0,
    _warnings: warnings,
    _source: {
      csv: options.csvFileName,
      rowIndex,
      raw: row
    }
  };
  return song;
}

export function importSongsFromCsv(rows: CsvRowInput[], options: CsvImportOptions): CsvImportReport {
  const dedupeByTj = new Map<string, number>();
  const dedupeByTitleArtist = new Map<string, number>();
  const songs: ImportedSong[] = [];
  const skippedRows: CsvImportReport["skippedRows"] = [];
  const warningRows: CsvImportReport["warningRows"] = [];

  rows.forEach((row, rowIndex) => {
    const song = csvRowToSong(row, rowIndex, options);
    if (!song.title || !song.artist) {
      skippedRows.push({ rowIndex, reason: "필수 필드 누락 (곡명/아티스트)", raw: row });
      return;
    }
    if (song.tjNumber) {
      const existing = dedupeByTj.get(song.tjNumber);
      if (existing !== undefined) {
        skippedRows.push({ rowIndex, reason: `TJ 번호 중복 (행 ${existing + 1})`, raw: row });
        return;
      }
      dedupeByTj.set(song.tjNumber, rowIndex);
    }
    const dedupKey = song.title.toLowerCase() + "|" + song.artist.toLowerCase();
    const existingTitleArtist = dedupeByTitleArtist.get(dedupKey);
    if (existingTitleArtist !== undefined) {
      skippedRows.push({ rowIndex, reason: `곡명/아티스트 중복 (행 ${existingTitleArtist + 1})`, raw: row });
      return;
    }
    dedupeByTitleArtist.set(dedupKey, rowIndex);

    if (song._warnings.length) {
      warningRows.push({ rowIndex, reason: song._warnings.join("; "), raw: row });
    }
    songs.push(song);
  });

  return {
    totalRows: rows.length,
    inserted: songs.length,
    skipped: skippedRows.length,
    warnings: warningRows.length,
    songs,
    skippedRows,
    warningRows
  };
}
