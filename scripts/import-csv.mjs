// Ponytail-friendly CSV importer.
// Reads the source CSV(s) under /Users/marie/Downloads, normalizes rows into
// Songbook's Song model, deduplicates by TJ number and (title, artist), and
// writes three artifacts:
//   - apps-script/seed/songs.json: payload for Apps Script `importCsvSongs`.
//   - apps-script/seed/import-report.json: human-readable import summary.
//   - packages/shared/src/sample.ts: the dev/mock seed used by the web app
//     when no Apps Script URL is configured.
// The script is idempotent: re-running it overwrites all three artifacts with
// the latest CSV. It does not push to GitHub or Google.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { importSongsFromCsv } from "@songbook/shared";
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const sourceDir = "/Users/marie/Downloads/개인 페이지 & 공유된 페이지";
const primaryCsv = "OK DAM!! 3 56a5080d79c147c1915776897acaee2f_all.csv";
const compareCsv = "OK DAM!! 3 56a5080d79c147c1915776897acaee2f.csv";
const ALIASES = {
  "곡명": "title",
  "번호": "tjNumber",
  "키": "key",
  "아티스트": "artist",
  "원작": "originalWork",
  "장르": "country",
  "추천인": "recommender",
  "생성 일시": "createdAt",
  "국가": "country",
  "메모": "memo"
};
function parseCsv(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((line) => line.length);
  return lines.map((line) => {
    const out = [];
    let current = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (inQuote) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else {
            inQuote = false;
          }
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        inQuote = true;
      } else if (ch === ",") {
        out.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    out.push(current);
    return out;
  });
}
function rowsToObjects(lines) {
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].map((h) => ALIASES[h] || h);
  const rows = lines.slice(1).map((cells) => {
    const object = {};
    headers.forEach((header, index) => {
      object[header] = (cells[index] ?? "").trim();
    });
    return object;
  }).filter((object) => Object.values(object).some((value) => value.length > 0));
  return { headers, rows };
}
function readRows(csvFileName) {
  const fullPath = resolve(sourceDir, csvFileName);
  const text = readFileSync(fullPath, "utf8");
  return rowsToObjects(parseCsv(text));
}
function stripSong(song) {
  // Drop internal fields before persisting the sample seed or seed payload.
  const { _warnings, _source, ...rest } = song;
  return rest;
}
function toSeedPayload(report) {
  return {
    songs: report.songs.map((song) => stripSong(song))
  };
}
function sampleSource(report) {
  return report.songs.map(stripSong);
}
function renderSampleModule(songs) {
  const json = JSON.stringify(songs, null, 2);
  const banner = "// AUTO-GENERATED from scripts/import-csv.mjs on " + new Date().toISOString() + ".\n"
    + "// Do not edit by hand; rerun the importer to refresh this file with the latest\n"
    + "// CSV data from /Users/marie/Downloads/개인 페이지 & 공유된 페이지.\n";
  return banner + "import type { Song } from \"./schemas\";\n\nexport const sampleSongs: Song[] = " + json + ";\n";
}
function renderReport(report, sources) {
  return {
    generatedAt: new Date().toISOString(),
    sources: sources.map(({ name, totalRows, headers }) => ({ name, totalRows, headers })),
    totalRows: report.totalRows,
    inserted: report.inserted,
    skipped: report.skipped,
    warnings: report.warnings,
    performerRows: report.performerRows,
    ponyaRows: report.ponyaRows,
    seongukCorrections: report.seongukCorrections,
    yeoulCorrections: report.yeoulCorrections,
    memoRecommenderRemoved: report.memoRecommenderRemoved,
    unknownPerformerNames: report.unknownPerformerNames,
    emptyPerformerIds: report.emptyPerformerIds,
    warningRows: report.warningRows,
    skippedRows: report.skippedRows
  };
}
function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}
function main() {
  if (!existsSync(resolve(sourceDir, primaryCsv))) {
    console.error("[import-csv] primary CSV not found: " + resolve(sourceDir, primaryCsv));
    process.exit(1);
  }
  const generatedAt = new Date().toISOString();
  const primary = readRows(primaryCsv);
  const compare = readRows(compareCsv);
  const report = importSongsFromCsv(primary.rows, {
    csvFileName: primaryCsv,
    generatedAt,
    idFactory: (() => {
      let n = 0;
      return () => "csv-" + generatedAt.slice(0, 10) + "-" + String(++n).padStart(4, "0");
    })(),
    keyIdFactory: (() => {
      let n = 0;
      return () => "key-" + generatedAt.slice(0, 10) + "-" + String(++n).padStart(4, "0");
    })()
  });
  const seedJsonPath = resolve(repoRoot, "apps-script/seed/songs.json");
  const reportJsonPath = resolve(repoRoot, "apps-script/seed/import-report.json");
  const sampleTsPath = resolve(repoRoot, "packages/shared/src/sample.ts");
  ensureDir(seedJsonPath);
  writeFileSync(seedJsonPath, JSON.stringify(toSeedPayload(report), null, 2));
  writeFileSync(reportJsonPath, JSON.stringify(renderReport(report, [
    { name: primaryCsv, totalRows: primary.rows.length, headers: primary.headers },
    { name: compareCsv, totalRows: compare.rows.length, headers: compare.headers }
  ]), null, 2));
  writeFileSync(sampleTsPath, renderSampleModule(sampleSource(report)));
  console.log("[import-csv] rows:", report.totalRows);
  console.log("[import-csv] inserted:", report.inserted);
  console.log("[import-csv] skipped:", report.skipped);
  console.log("[import-csv] warnings:", report.warnings);
  if (report.warningRows.length) {
    console.log("[import-csv] warning rows:");
    for (const w of report.warningRows.slice(0, 10)) {
      console.log("  - row " + (w.rowIndex + 1) + ": " + w.reason);
    }
  }
  if (report.skippedRows.length) {
    console.log("[import-csv] skipped rows:");
    for (const s of report.skippedRows.slice(0, 10)) {
      console.log("  - row " + (s.rowIndex + 1) + ": " + s.reason);
    }
  }
  console.log("[import-csv] wrote:");
  console.log("  -", seedJsonPath);
  console.log("  -", reportJsonPath);
  console.log("  -", sampleTsPath);
}
main();
