type DateStyle = "short" | "long";

/** 画面表示は常に日本時間（サーバー UTC でも日付がずれないようにする） */
const DISPLAY_TIME_ZONE = "Asia/Tokyo";

const OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: {
    timeZone: DISPLAY_TIME_ZONE,
    month: "short",
    day: "numeric",
  },
  long: {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
};

export function formatDate(value: string, style: DateStyle = "short") {
  try {
    return new Intl.DateTimeFormat("ja-JP", OPTIONS[style]).format(
      new Date(value),
    );
  } catch {
    return value;
  }
}
