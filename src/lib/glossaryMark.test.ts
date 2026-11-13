import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  markGlossaryBlocks,
  markGlossaryTerms,
  type GlossarySegment,
} from "./glossaryMark";
import type { ArticleTerm } from "./types";

function term(name: string, plain = `${name}の解説`): ArticleTerm {
  return { term: name, plain };
}

function marked(segments: GlossarySegment[]): string[] {
  return segments.filter((segment) => segment.type === "term").map((segment) => segment.text);
}

function roundTrip(
  text: string,
  terms: ArticleTerm[],
  options?: Parameters<typeof markGlossaryTerms>[2],
): GlossarySegment[] {
  const segments = markGlossaryTerms(text, terms, options);
  assert.equal(
    segments.map((segment) => segment.text).join(""),
    text,
  );
  return segments;
}

describe("markGlossaryTerms", () => {
  it("marks the first occurrence of each term and keeps the rest as text", () => {
    const segments = roundTrip("APIを使い、再びAPIを呼ぶ", [term("API")]);
    assert.deepEqual(marked(segments), ["API"]);
    assert.equal(segments[0]?.type, "term");
    assert.equal(segments[0]?.type === "term" ? segments[0].plain : "", "APIの解説");
  });

  it("marks every occurrence when asked", () => {
    const segments = roundTrip("APIとAPI", [term("API")], { occurrence: "all" });
    assert.deepEqual(marked(segments), ["API", "API"]);
  });

  it("prefers the longer term when both start at the same place", () => {
    const segments = roundTrip("APIキーとAPI", [
      term("API", "短い"),
      term("APIキー", "長い"),
    ]);
    assert.deepEqual(marked(segments), ["APIキー", "API"]);
    const apiKey = segments.find(
      (segment): segment is Extract<GlossarySegment, { type: "term" }> =>
        segment.type === "term" && segment.text === "APIキー",
    );
    assert.equal(apiKey?.plain, "長い");
  });

  it("lets a longer Japanese term win over its substring", () => {
    const segments = roundTrip("機械学習を使う", [term("学習"), term("機械学習")]);
    assert.deepEqual(marked(segments), ["機械学習"]);
  });

  it("matches Japanese terms without word boundaries", () => {
    const segments = roundTrip("（エージェント挙動）を見る", [term("エージェント")]);
    assert.deepEqual(marked(segments), ["エージェント"]);
  });

  it("does not cut an ASCII term out of a longer word", () => {
    const inside = roundTrip("WebAPIとAPIs", [term("API")]);
    assert.deepEqual(marked(inside), []);
    const bounded = roundTrip("新しい API です", [term("API")]);
    assert.deepEqual(marked(bounded), ["API"]);
  });

  it("matches an ASCII term next to Japanese letters", () => {
    const segments = roundTrip("APIです。", [term("API")]);
    assert.deepEqual(marked(segments), ["API"]);
  });

  it("is case sensitive", () => {
    const segments = roundTrip("api と API", [term("API")]);
    assert.deepEqual(marked(segments), ["API"]);
  });

  it("skips code spans, fences, links, urls, and html", () => {
    const text = [
      "`API` のあと API",
      "```",
      "API",
      "```",
      "本文の API",
      "詳しくは [API](https://example.com/api) と https://api.example.com/docs",
      "<code>API</code> と <a href=\"https://example.com\">API</a>",
      "<p>API</p>",
      "<!-- API --> 最後の API",
    ].join("\n");
    const segments = roundTrip(text, [term("API")], { occurrence: "all" });
    assert.deepEqual(marked(segments), ["API", "API", "API", "API"]);
    assert.equal(segments.map((segment) => segment.text).join("").includes("[API]("), true);
  });

  it("marks a term that appears outside code even when the first copy is inside code", () => {
    const segments = roundTrip("`API` と API", [term("API")]);
    assert.deepEqual(marked(segments), ["API"]);
    assert.equal(segments.at(-1)?.type, "term");
  });

  it("keeps the first definition when the same term is repeated", () => {
    const segments = roundTrip("キャッシュ", [
      term("キャッシュ", "先"),
      term("キャッシュ", "後"),
    ]);
    assert.equal(segments[0]?.type === "term" ? segments[0].plain : "", "先");
  });

  it("ignores blank terms and terms that never appear", () => {
    const segments = roundTrip("本文だけ", [
      term("  ", "空"),
      { term: "レート制限", plain: "   " },
      term("存在しない"),
    ]);
    assert.deepEqual(segments, [{ type: "text", text: "本文だけ" }]);
  });

  it("does not lose characters around emoji", () => {
    const segments = roundTrip("😀APIです", [term("API")]);
    assert.deepEqual(marked(segments), ["API"]);
  });

  it("counts the first occurrence across blocks in reading order", () => {
    const [conclusion, detail] = markGlossaryBlocks(
      ["APIの話", "詳細でもAPI"],
      [term("API")],
    );
    assert.deepEqual(marked(conclusion), ["API"]);
    assert.deepEqual(marked(detail), []);
  });

  it("does not mark a hidden later block's term as already used", () => {
    const [onlyConclusion] = markGlossaryBlocks(["ここには無い"], [term("API")]);
    assert.deepEqual(marked(onlyConclusion), []);
  });
});
