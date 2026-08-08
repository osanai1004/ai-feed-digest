const PALETTE = [
  { badge: "rgba(27,100,224,0.12)", text: "#1b64e0", bar: "#1b64e0" },
  { badge: "rgba(14,116,144,0.14)", text: "#0e7490", bar: "#0e7490" },
  { badge: "rgba(180,83,9,0.14)", text: "#b45309", bar: "#d97706" },
  { badge: "rgba(15,118,110,0.14)", text: "#0f766e", bar: "#0f766e" },
  { badge: "rgba(67,56,202,0.12)", text: "#4338ca", bar: "#4f46e5" },
  { badge: "rgba(22,101,52,0.14)", text: "#166534", bar: "#15803d" },
] as const;

export function styleForSource(source: string) {
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash + source.charCodeAt(i) * (i + 1)) % 997;
  }
  return PALETTE[hash % PALETTE.length];
}
