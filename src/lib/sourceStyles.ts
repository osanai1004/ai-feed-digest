const PALETTE = [
  { badge: "rgba(20,184,166,0.18)", text: "#14b8a6", bar: "#14b8a6" },
  { badge: "rgba(249,115,22,0.18)", text: "#fb923c", bar: "#f97316" },
  { badge: "rgba(59,130,246,0.18)", text: "#60a5fa", bar: "#3b82f6" },
  { badge: "rgba(236,72,153,0.18)", text: "#f472b6", bar: "#ec4899" },
  { badge: "rgba(139,92,246,0.18)", text: "#a78bfa", bar: "#8b5cf6" },
  { badge: "rgba(132,204,22,0.18)", text: "#a3e635", bar: "#84cc16" },
] as const;

export function styleForSource(source: string) {
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash + source.charCodeAt(i) * (i + 1)) % 997;
  }
  return PALETTE[hash % PALETTE.length];
}
