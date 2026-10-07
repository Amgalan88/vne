// Дэд домэйны дүрэм — supabase/schema.sql-ийн slug_available-тай ижил
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export function normalizeSlug(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
}

export function isValidSlug(v: string): boolean {
  return SLUG_RE.test(v) && !v.includes("--");
}
