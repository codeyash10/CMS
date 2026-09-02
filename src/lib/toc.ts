/**
 * Table-of-contents extraction from rendered blog HTML.
 *
 * Pure string parsing (no DOM APIs) so this same module can run either in the
 * browser (this CMS's preview) or during server-side rendering on the live
 * site, with identical slug rules on both sides.
 */

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function headingPattern() {
  return /<(h[23])(\s[^>]*)?>([\s\S]*?)<\/h[23]>/gi;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string) {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1]?.toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function stripTags(html: string) {
  return decodeEntities(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

/** Slugifies heading text using the same rule the live site should use, so anchors match. */
export function slugify(text: string) {
  const slug = text
    .toLowerCase()
    .replace(/['"’‘“”]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

function dedupeSlug(base: string, seen: Map<string, number>) {
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

/** Extracts an ordered list of {id, text, level} for every h2/h3 in `html`. */
export function extractHeadings(html: string): TocHeading[] {
  const seen = new Map<string, number>();
  const headings: TocHeading[] = [];
  for (const match of html.matchAll(headingPattern())) {
    const level = Number(match[1].slice(1)) as 2 | 3;
    const text = stripTags(match[3]);
    if (!text) continue;
    headings.push({ id: dedupeSlug(slugify(text), seen), text, level });
  }
  return headings;
}

/** Returns `html` with an `id` attribute injected onto every h2/h3, matching extractHeadings' ids in order. */
export function withHeadingIds(html: string): string {
  const seen = new Map<string, number>();
  return html.replace(headingPattern(), (full, tag: string, attrs = "", inner: string) => {
    const text = stripTags(inner);
    if (!text) return full;
    const id = dedupeSlug(slugify(text), seen);
    const cleanedAttrs = attrs.replace(/\sid="[^"]*"/i, "");
    return `<${tag} id="${id}"${cleanedAttrs}>${inner}</${tag}>`;
  });
}
