import type { Song } from "./schemas";

export const sampleSongs: Song[] = [
  {
    id: "sample-phony",
    tjNumber: "52537",
    title: "フォニイ",
    titleReadingKo: "포니",
    titleRomanized: "phony",
    titleAliases: ["phony"],
    artist: "ツミキ(Feat. 可不)",
    artistReadingKo: "츠미키(Feat. 카후)",
    artistAliases: ["츠미키", "카후"],
    country: "일본",
    genres: ["보컬로이드"],
    originalWork: "",
    keyCandidates: [
      {
        id: "sample-key-id",
        baseMode: "original",
        offset: -2,
        label: "추천",
        memo: "",
        isPrimary: true
      }
    ],
    memo: "후렴 전 호흡 체크",
    status: "active",
    youtubeUrl: "",
    youtubeVideoId: "",
    isOfficialTjVideo: null,
    sourceType: "sample",
    sourceReference: "development",
    createdByName: "마리",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedByName: "마리",
    updatedAt: "2026-07-01T00:00:00.000Z",
    deletedAt: "",
    version: 1,
    lastPerformedAt: "",
    performanceCount: 0
  },
  {
    id: "sample-lemon",
    tjNumber: "28822",
    title: "Lemon",
    titleReadingKo: "레몬",
    titleRomanized: "lemon",
    titleAliases: [],
    artist: "米津玄師",
    artistReadingKo: "요네즈 켄시",
    artistAliases: ["요네즈켄시"],
    country: "일본",
    genres: ["J-POP"],
    originalWork: "アンナチュラル",
    keyCandidates: [{ id: "sample-key-lemon", baseMode: "original", offset: -1, label: "추천", memo: "", isPrimary: true }],
    memo: "",
    status: "favorite",
    youtubeUrl: "",
    youtubeVideoId: "",
    isOfficialTjVideo: null,
    sourceType: "sample",
    sourceReference: "development",
    createdByName: "성욱",
    createdAt: "2026-07-01T00:10:00.000Z",
    updatedByName: "성욱",
    updatedAt: "2026-07-01T00:10:00.000Z",
    deletedAt: "",
    version: 1,
    lastPerformedAt: "2026-06-29T12:00:00.000Z",
    performanceCount: 3
  }
];

