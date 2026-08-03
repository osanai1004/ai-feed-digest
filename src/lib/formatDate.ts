type DateStyle = "short" | "long";

const OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: {
    month: "short",
    day: "numeric",
  },
  long: {
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
