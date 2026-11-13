import type { ArticleTerm } from "./types";

/** 本文を、そのまま出す文字列と、押せる用語に分けたもの */
export type GlossarySegment =
  | { type: "text"; text: string }
  | { type: "term"; text: string; term: string; plain: string };

export type MarkGlossaryOptions = {
  /**
   * first: 各用語の最初の1回だけマークする。
   * all: 保護範囲の外にある出現をすべてマークする。
   */
  occurrence?: "first" | "all";
  /**
   * 複数の本文をまたいで first を数えるとき、すでにマークした用語名を入れる。
   * 新しくマークした用語名もこの Set に追加する。
   */
  seen?: Set<string>;
};

type Range = { start: number; end: number };

const ASCII_ALNUM = /[A-Za-z0-9]/;

/**
 * 用語を本文へ重ねる。
 * 左から走査し、同じ位置では長い用語を優先する（日本語の最長一致）。
 * コード、リンク、URL、HTML タグの中はマークしない。
 */
export function markGlossaryTerms(
  text: string,
  terms: readonly ArticleTerm[],
  options: MarkGlossaryOptions = {},
): GlossarySegment[] {
  if (!text) return [];

  const occurrence = options.occurrence ?? "first";
  const seen = options.seen ?? new Set<string>();
  const prepared = prepareTerms(terms);
  const ranges = findProtectedRanges(text);
  const segments: GlossarySegment[] = [];
  let plainStart = 0;
  let index = 0;

  const flush = (end: number) => {
    if (end <= plainStart) return;
    segments.push({ type: "text", text: text.slice(plainStart, end) });
    plainStart = end;
  };

  while (index < text.length) {
    const covering = ranges.find(
      (range) => index >= range.start && index < range.end,
    );
    if (covering) {
      index = covering.end;
      continue;
    }

    const match = longestTermAt(text, index, prepared, ranges, seen, occurrence);
    if (!match) {
      index += 1;
      continue;
    }

    flush(index);
    const end = index + match.term.length;
    segments.push({
      type: "term",
      text: text.slice(index, end),
      term: match.term,
      plain: match.plain,
    });
    if (occurrence === "first") seen.add(match.term);
    index = end;
    plainStart = end;
  }

  flush(text.length);
  return segments;
}

/**
 * 上から読む順に、表示中の本文ブロックへ用語を重ねる。
 * occurrence が first のとき、先のブロックでマークした用語は後ろではマークしない。
 */
export function markGlossaryBlocks(
  blocks: readonly string[],
  terms: readonly ArticleTerm[],
  occurrence: MarkGlossaryOptions["occurrence"] = "first",
): GlossarySegment[][] {
  const seen = new Set<string>();
  return blocks.map((block) =>
    markGlossaryTerms(block, terms, { occurrence, seen }),
  );
}

function prepareTerms(terms: readonly ArticleTerm[]): ArticleTerm[] {
  const seen = new Set<string>();
  const prepared: ArticleTerm[] = [];
  for (const raw of terms) {
    const term = raw.term.trim();
    const plain = raw.plain.trim();
    if (!term || !plain || seen.has(term)) continue;
    seen.add(term);
    prepared.push({ term, plain });
  }
  prepared.sort(
    (a, b) => b.term.length - a.term.length || a.term.localeCompare(b.term),
  );
  return prepared;
}

function longestTermAt(
  text: string,
  index: number,
  terms: readonly ArticleTerm[],
  ranges: readonly Range[],
  seen: ReadonlySet<string>,
  occurrence: "first" | "all",
): ArticleTerm | null {
  for (const candidate of terms) {
    if (occurrence === "first" && seen.has(candidate.term)) continue;
    if (!text.startsWith(candidate.term, index)) continue;
    if (!hasBoundary(text, index, candidate.term)) continue;
    const end = index + candidate.term.length;
    if (ranges.some((range) => index < range.end && end > range.start)) continue;
    return candidate;
  }
  return null;
}

/**
 * 英数字で始まる・終わる用語は、英数字の途中では切らない。
 * 日本語は単語境界が無いので、部分一致を許す。
 */
function hasBoundary(text: string, start: number, term: string): boolean {
  const first = term[0];
  const last = term[term.length - 1];
  if (first && ASCII_ALNUM.test(first)) {
    const before = start > 0 ? text[start - 1] : undefined;
    if (before && ASCII_ALNUM.test(before)) return false;
  }
  if (last && ASCII_ALNUM.test(last)) {
    const after = text[start + term.length];
    if (after && ASCII_ALNUM.test(after)) return false;
  }
  return true;
}

function findProtectedRanges(text: string): Range[] {
  const ranges: Range[] = [];
  let index = 0;
  while (index < text.length) {
    const found =
      matchFence(text, index) ??
      matchInlineCode(text, index) ??
      matchUrl(text, index) ??
      matchHtmlSkipBlock(text, index) ??
      matchHtmlTag(text, index) ??
      matchMarkdownLink(text, index);
    if (!found) {
      index += 1;
      continue;
    }
    ranges.push(found);
    index = found.end;
  }
  return ranges;
}

function matchFence(text: string, index: number): Range | null {
  if (index > 0 && text[index - 1] !== "\n") return null;
  let cursor = index;
  let indent = 0;
  while (text[cursor] === " " && indent < 4) {
    cursor += 1;
    indent += 1;
  }
  if (indent > 3) return null;
  const marker = text[cursor];
  if (marker !== "`" && marker !== "~") return null;
  let count = 0;
  while (text[cursor + count] === marker) count += 1;
  if (count < 3) return null;

  const openLineEnd = text.indexOf("\n", cursor);
  if (openLineEnd === -1) return { start: index, end: text.length };

  let search = openLineEnd + 1;
  while (search <= text.length) {
    const nextBreak = text.indexOf("\n", search);
    const lineEnd = nextBreak === -1 ? text.length : nextBreak;
    if (isClosingFence(text.slice(search, lineEnd), marker, count)) {
      return {
        start: index,
        end: nextBreak === -1 ? text.length : nextBreak + 1,
      };
    }
    if (nextBreak === -1) break;
    search = nextBreak + 1;
  }
  return { start: index, end: text.length };
}

function isClosingFence(line: string, marker: string, count: number): boolean {
  let index = 0;
  while (line[index] === " ") index += 1;
  if (index > 3) return false;
  let end = index;
  while (line[end] === marker) end += 1;
  if (end - index < count) return false;
  while (line[end] === " ") end += 1;
  return end === line.length;
}

function matchInlineCode(text: string, index: number): Range | null {
  if (text[index] !== "`") return null;
  let ticks = 0;
  while (text[index + ticks] === "`") ticks += 1;
  const closer = "`".repeat(ticks);
  let search = index + ticks;
  while (search < text.length) {
    const found = text.indexOf(closer, search);
    if (found === -1) return null;
    if (text[found + ticks] === "`") {
      search = found + 1;
      continue;
    }
    const content = text.slice(index + ticks, found);
    if (!content || content.includes("\n\n")) return null;
    if (ticks === 1 && content.includes("\n")) return null;
    return { start: index, end: found + ticks };
  }
  return null;
}

function matchUrl(text: string, index: number): Range | null {
  const head = text.slice(index, index + 8).toLowerCase();
  const isHttps = head.startsWith("https://");
  const isHttp = !isHttps && head.startsWith("http://");
  if (!isHttps && !isHttp) return null;
  const before = index > 0 ? text[index - 1] : undefined;
  if (before && ASCII_ALNUM.test(before)) return null;
  let end = index + (isHttps ? 8 : 7);
  while (end < text.length && !/[\s<>"'`]/.test(text[end])) end += 1;
  while (end > index && /[.,;:!?)\]]/.test(text[end - 1])) end -= 1;
  if (end <= index + (isHttps ? 8 : 7)) return null;
  return { start: index, end };
}

function matchHtmlSkipBlock(text: string, index: number): Range | null {
  if (text[index] !== "<") return null;
  const head = text.slice(index, index + 12).toLowerCase();
  for (const tag of ["a", "code", "pre"] as const) {
    const open = `<${tag}`;
    if (!head.startsWith(open)) continue;
    const boundary = text[index + open.length];
    if (
      boundary !== ">" &&
      boundary !== "/" &&
      boundary !== " " &&
      boundary !== "\n" &&
      boundary !== "\t" &&
      boundary !== "\r"
    ) {
      continue;
    }
    const openEnd = text.indexOf(">", index);
    if (openEnd === -1) return null;
    if (text[openEnd - 1] === "/") return { start: index, end: openEnd + 1 };
    const close = `</${tag}>`;
    const closeAt = text.toLowerCase().indexOf(close, openEnd + 1);
    if (closeAt === -1) return { start: index, end: openEnd + 1 };
    return { start: index, end: closeAt + close.length };
  }
  return null;
}

function matchHtmlTag(text: string, index: number): Range | null {
  if (text[index] !== "<") return null;
  if (text.startsWith("<!--", index)) {
    const end = text.indexOf("-->", index + 4);
    if (end === -1) return null;
    return { start: index, end: end + 3 };
  }
  const match = /^<\/?[A-Za-z][^<>\n]*>/.exec(text.slice(index));
  if (!match) return null;
  return { start: index, end: index + match[0].length };
}

function matchMarkdownLink(text: string, index: number): Range | null {
  if (index > 0 && text[index - 1] === "\\") return null;
  const bracket =
    text[index] === "!" && text[index + 1] === "["
      ? index + 1
      : text[index] === "["
        ? index
        : -1;
  if (bracket === -1) return null;
  if (text[index] === "[" && index > 0 && text[index - 1] === "!") return null;

  let cursor = bracket + 1;
  let depth = 1;
  while (cursor < text.length && depth > 0) {
    const char = text[cursor];
    if (char === "\n") return null;
    if (char === "[") depth += 1;
    else if (char === "]") depth -= 1;
    cursor += 1;
  }
  if (depth !== 0 || text[cursor] !== "(") return null;
  cursor += 1;
  let parens = 1;
  while (cursor < text.length && parens > 0) {
    const char = text[cursor];
    if (char === "\n") return null;
    if (char === "(") parens += 1;
    else if (char === ")") parens -= 1;
    cursor += 1;
  }
  if (parens !== 0) return null;
  return { start: index, end: cursor };
}
