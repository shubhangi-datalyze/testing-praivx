export const SHELVES = [
  { id: "want_to_read", label: "Want to read" },
  { id: "reading", label: "Reading" },
  { id: "finished", label: "Finished" },
] as const;

export type ShelfId = (typeof SHELVES)[number]["id"];

export function isShelf(value: unknown): value is ShelfId {
  return SHELVES.some((s) => s.id === value);
}

export function shelfLabel(id: string) {
  return SHELVES.find((s) => s.id === id)?.label ?? id;
}

export const GENRES = [
  "Fiction",
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Romance",
  "History",
  "Biography",
  "Science",
  "Self-help",
  "Business",
] as const;

export const PRO_PRICE_CENTS = 500;
