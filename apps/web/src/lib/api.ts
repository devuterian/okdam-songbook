import { publicDataSchema, sampleSongs, type CurrentUser, type PublicData, type Song } from "@songbook/shared";

const apiUrl = import.meta.env.VITE_APPS_SCRIPT_API_URL as string | undefined;
const enableMock = (import.meta.env.VITE_ENABLE_MOCK_API ?? "true") === "true";
// Mock is local-dev only. Production must explicitly disable mock and point at
// the real Apps Script /exec URL. An empty API URL must fail loudly.
export const mockMode = enableMock;
export const productionMisconfigured = !enableMock && !apiUrl;

function missingApiUrl(): never {
  throw new Error("VITE_APPS_SCRIPT_API_URL이 설정되지 않았어. Apps Script webapp /exec URL을 GitHub Actions Variable에 등록해.");
}

function nowIso(): string {
  return new Date().toISOString();
}

async function parseResponse<T>(response: Response, parser: (value: unknown) => T): Promise<T> {
  const json = await response.json();
  if (!json.ok) {
    throw new Error(json.error?.message ?? "요청에 실패했어.");
  }
  return parser(json.data);
}

export async function fetchPublicData(): Promise<PublicData> {
  if (productionMisconfigured) missingApiUrl();
  if (mockMode) {
    return publicDataSchema.parse({
      songs: sampleSongs,
      serverVersion: "mock-1",
      updatedAt: nowIso()
    });
  }
  const response = await fetch(`${apiUrl}?action=publicData`, { method: "GET" });
  return parseResponse(response, (data) => publicDataSchema.parse(data));
}

export async function fetchCurrentUser(idToken: string): Promise<CurrentUser> {
  if (mockMode) return { email: "owner@example.com", displayName: "마리", role: "owner" };
  const response = await fetch(`${apiUrl}?action=currentUser`, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ idToken })
  });
  return parseResponse(response, (data) => data as CurrentUser);
}

export async function createPerformance(songId: string, idToken: string | null, clientRequestId: string): Promise<{ id: string; duplicate?: boolean }> {
  if (mockMode) return { id: `mock-${clientRequestId}` };
  const response = await fetch(`${apiUrl}?action=createPerformance`, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ idToken, songId, clientRequestId, performedAt: nowIso() })
  });
  return parseResponse(response, (data) => data as { id: string; duplicate?: boolean });
}

export async function cancelPerformance(performanceId: string, idToken: string, clientRequestId: string): Promise<void> {
  if (mockMode) return;
  const response = await fetch(`${apiUrl}?action=cancelPerformance`, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ idToken, performanceId, clientRequestId })
  });
  await parseResponse(response, () => null);
}

export async function upsertSong(song: Partial<Song>, idToken: string, clientRequestId: string): Promise<Song> {
  if (mockMode) {
    return { ...sampleSongs[0], ...song, id: song.id || crypto.randomUUID(), version: (song.version ?? 0) + 1 } as Song;
  }
  const response = await fetch(`${apiUrl}?action=upsertSong`, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ idToken, song, clientRequestId })
  });
  return parseResponse(response, (data) => data as Song);
}

export async function analyzeYouTube(url: string, idToken: string): Promise<Partial<Song>> {
  if (mockMode) return { youtubeUrl: url, sourceType: "youtube", sourceReference: url };
  const response = await fetch(`${apiUrl}?action=analyzeYouTube`, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ idToken, url })
  });
  return parseResponse(response, (data) => data as Partial<Song>);
}

export async function generateReading(input: { title: string; artist: string }, idToken: string): Promise<{ titleReadingKo: string; artistReadingKo: string }> {
  if (mockMode) return { titleReadingKo: input.title, artistReadingKo: input.artist };
  const response = await fetch(`${apiUrl}?action=generateReading`, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ idToken, input })
  });
  return parseResponse(response, (data) => data as { titleReadingKo: string; artistReadingKo: string });
}
