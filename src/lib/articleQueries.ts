/**
 * 記事一覧・詳細の SQL（Neon の転送量を抑える）。
 * 文字列と引数だけを組み立てる純粋な関数にし、本番は neon の sql.query、
 * 検証はローカルの Postgres で同じ文を流す。
 */
import { isMetricSort } from "./xMetrics";
import type { ArticleChannel, ListOrder, ListWindow, XListSort } from "./constants";

export type BuiltQuery = { text: string; params: unknown[] };

/** 公開日時。mapArticleRow の published_at ?? created_at と同じ */
const PUBLISHED_KEY = "COALESCE(published_at, created_at)";

/**
 * 一覧・詳細で返す列。
 * conclusion / situations は summary_json が無い旧データでしか使わないので、
 * summary_json がオブジェクトか配列のとき（mapArticleRow が summary_json を読むとき）は NULL で返し、二重に運ばない。
 */
export const ARTICLE_COLUMNS = `id, source, title, url, published_at,
  CASE WHEN jsonb_typeof(summary_json) IN ('object', 'array') THEN NULL ELSE conclusion END AS conclusion,
  CASE WHEN jsonb_typeof(summary_json) IN ('object', 'array') THEN NULL ELSE situations END AS situations,
  summary_json, created_at, origin, x_post_url, official_note,
  impressions, reposts, likes, metrics_updated_at`;

/** 関連記事の採点に要る列だけ（findRelatedArticles は id・source・title・公開日時しか見ない） */
export const RELATED_CANDIDATE_COLUMNS = "id, source, title, published_at, created_at";

/**
 * 検索語で SQL 側の候補を絞るための断片。
 *
 * 画面の一致判定（articleSearchText(article).includes(q.toLowerCase())）は、
 * 正規化後の要約（trim・改行の畳み込み・既定文の補完）に対して行う。
 * SQL では正規化前の列しか見えないので、ここでは「必ず取りこぼさない」側の粗い条件だけを作り、
 * 最終判定はこれまでと同じ JS の filterArticles に任せる（結果は変わらない）。
 *
 * - 空白・制御文字・" と \ で区切る（JSON の文字列表現で形が変わる文字と、正規化で変わる空白を跨がない）
 * - 正規化で補われる既定文（未入力の表示など）に含まれうる断片は使わない
 * - 大文字小文字の対応が JS と Postgres で揺れうる文字（ASCII 以外で大小の区別がある文字と、İ の展開で出る U+0307）を含む断片は使わない
 */
const INJECTED_TEXTS = [
  "（結論未入力）",
  "（シチュエーション未入力）",
  "[object object]",
];

function hasLocaleSensitiveCase(fragment: string): boolean {
  for (const ch of fragment) {
    if (ch.charCodeAt(0) < 0x80) continue;
    if (ch.toLowerCase() !== ch.toUpperCase()) return true;
    // JS は İ を "i" + U+0307 に展開するが、Postgres の lower() は "i" だけにする
    if (ch === "\u0307") return true;
  }
  return false;
}

export function searchPrefilterFragments(q: string): string[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const parts = needle.split(/[\s\u0000-\u001f\u007f"\\]+/u).filter(Boolean);
  const usable = parts.filter(
    (part) =>
      !hasLocaleSensitiveCase(part) &&
      !INJECTED_TEXTS.some((text) => text.includes(part)),
  );
  return [...new Set(usable)];
}

/** 正規化前の検索対象。summary_json と旧列の両方を見る（どちらが使われても取りこぼさない） */
const SEARCH_HAYSTACK = `lower(
  title || E'\\n' || source || E'\\n' ||
  COALESCE(summary_json::text, '') || E'\\n' ||
  COALESCE(conclusion, '') || E'\\n' ||
  COALESCE(situations::text, '')
)`;

function orderBy(sort: XListSort, order: ListOrder): string {
  const dir = order === "old" ? "ASC" : "DESC";
  const tail = `${PUBLISHED_KEY} ${dir}, id ${dir}`;
  if (isMetricSort(sort)) {
    // 数値の多い順が一番目。数値が無い記事は後ろ。同じ値の中は期間側の並び順
    return `${sort} DESC NULLS LAST, ${tail}`;
  }
  return tail;
}

export type ListQueryInput = {
  q: string;
  channel: ArticleChannel;
  window: ListWindow;
  order: ListOrder;
  /** showXChannelSort が false のときは latest を渡す */
  sort: XListSort;
  now: Date;
};

/**
 * ホーム一覧の母集団（articlesInBrowseScope と同じ範囲）を、並びまで含めて SQL で取る。
 * 検索語があるときはチャネルと期間を外し、検索の粗い条件で絞る（最終判定は JS）。
 */
export function buildListQuery(input: ListQueryInput): BuiltQuery {
  const where: string[] = [];
  const params: unknown[] = [];
  const searching = input.q.trim().length > 0;

  if (searching) {
    for (const fragment of searchPrefilterFragments(input.q)) {
      params.push(fragment);
      where.push(`strpos(${SEARCH_HAYSTACK}, $${params.length}) > 0`);
    }
  } else {
    if (input.channel === "x") where.push("origin = 'x'");
    if (input.channel === "official") where.push("origin IS DISTINCT FROM 'x'");
    if (input.window === "3d") {
      // 画面の公開日時は秒未満を落とした値（mapArticleRow）なので、比較も秒で切る
      params.push(input.now.toISOString());
      const now = `$${params.length}::timestamptz`;
      where.push(
        `date_trunc('second', ${PUBLISHED_KEY}) <= ${now}`,
        // 3日 = 72時間ちょうど（セッションのタイムゾーンの夏時間に左右されない書き方）
        `date_trunc('second', ${PUBLISHED_KEY}) >= ${now} - interval '72 hours'`,
      );
    }
  }

  const text = `SELECT ${ARTICLE_COLUMNS}
FROM articles
${where.length ? `WHERE ${where.join("\n  AND ")}` : ""}
ORDER BY ${orderBy(input.sort, input.order)}`;
  return { text, params };
}

export function buildArticleByIdQuery(id: string): BuiltQuery {
  return {
    text: `SELECT ${ARTICLE_COLUMNS} FROM articles WHERE id = $1 LIMIT 1`,
    params: [id],
  };
}

export function buildArticlesByIdsQuery(ids: string[]): BuiltQuery {
  return {
    text: `SELECT ${ARTICLE_COLUMNS} FROM articles WHERE id = ANY($1::text[])`,
    params: [ids],
  };
}

export function buildRelatedCandidatesQuery(): BuiltQuery {
  return {
    text: `SELECT ${RELATED_CANDIDATE_COLUMNS} FROM articles ORDER BY ${PUBLISHED_KEY} DESC`,
    params: [],
  };
}

/** 件数と最終取り込み時刻だけ（ヒーロー表示と、空のときのサンプル表示の判定） */
export function buildArticleStatsQuery(): BuiltQuery {
  return {
    text: "SELECT COUNT(*)::int AS total, MAX(created_at) AS last_created_at FROM articles",
    params: [],
  };
}

/** メモ件数だけ（presentSignal が落とす空の id・URL・本文は数えない） */
export function buildMemoCountQuery(): BuiltQuery {
  return {
    text: `SELECT COUNT(*)::int AS count FROM intake_signals
WHERE status = 'memo' AND id <> '' AND x_post_url <> '' AND body <> ''`,
    params: [],
  };
}
