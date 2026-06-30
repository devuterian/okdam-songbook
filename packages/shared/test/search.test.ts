import { describe, expect, it } from "vitest";
import { parseCsvKey, sampleSongs, searchSongs, sortSongs } from "../src";
import { getHangulChoseong, normalizeNumber, normalizeText } from "../src/normalize";

describe("normalization", () => {
  it("normalizes unicode width, case, and spaces", () => {
    expect(normalizeText("  Ｐｈｏｎｙ   TEST ")).toBe("phony test");
  });

  it("normalizes numbers", () => {
    expect(normalizeNumber("ＴＪ ５２５３７")).toBe("52537");
  });

  it("extracts Korean choseong", () => {
    expect(getHangulChoseong("포니")).toBe("ㅍㄴ");
  });
});

describe("search", () => {
  it("finds Japanese title by Korean reading", () => {
    expect(searchSongs(sampleSongs, "포니")[0]?.id).toBe("sample-phony");
  });

  it("finds by original Japanese and romanized text", () => {
    expect(searchSongs(sampleSongs, "フォニイ")[0]?.id).toBe("sample-phony");
    expect(searchSongs(sampleSongs, "phony")[0]?.id).toBe("sample-phony");
  });

  it("prioritizes TJ number search", () => {
    expect(searchSongs(sampleSongs, "52537")[0]?.id).toBe("sample-phony");
  });

  it("supports multi-token AND search", () => {
    expect(searchSongs(sampleSongs, "일본 보컬로이드")).toHaveLength(1);
  });

  it("sorts by Korean reading", () => {
    expect(sortSongs(sampleSongs, "title").map((song) => song.titleReadingKo)).toEqual(["레몬", "포니"]);
  });
});

describe("csv key parsing", () => {
  it("parses simple offsets", () => {
    expect(parseCsvKey("-2", () => "id").candidates[0]).toMatchObject({ baseMode: "original", offset: -2 });
  });

  it("warns on ambiguous offsets", () => {
    expect(parseCsvKey("-1?-2?").warnings.length).toBeGreaterThan(0);
  });
});

