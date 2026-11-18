/**
 * True when every word of `query` appears (case-insensitively, ignoring accents) in at least one of
 * `fields`. An empty or blank query matches everything.
 */
export function matchesSearchText(query: string, ...fields: (string | null | undefined)[]): boolean {
  const words = normalise(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const haystack = fields.map((field) => normalise(field ?? "")).join(" ");
  return words.every((word) => haystack.includes(word));
}

function normalise(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
