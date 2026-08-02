const PALETTE = [
  { badge: "#ccfbf1", text: "#0f766e", bar: "#14b8a6" },
  { badge: "#ffedd5", text: "#c2410c", bar: "#f97316" },
  { badge: "#dbeafe", text: "#1d4ed8", bar: "#3b82f6" },
  { badge: "#fce7f3", text: "#be185d", bar: "#ec4899" },
  { badge: "#ede9fe", text: "#6d28d9", bar: "#8b5cf6" },
  { badge: "#ecfccb", text: "#3f6212", bar: "#84cc16" },
] as const;

export function styleForSource(source: string) {
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash + source.charCodeAt(i) * (i + 1)) % 997;
  }
  return PALETTE[hash % PALETTE.length];
}
