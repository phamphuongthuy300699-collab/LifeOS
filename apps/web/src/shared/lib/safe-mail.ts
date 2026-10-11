/**
 * Email HTML is untrusted: never mount it into the app DOM.
 * Safe interim rendering is text-only until a sandboxed HTML viewer is available.
 */
export function htmlToSafeText(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|svg|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos|nbsp);/gi, (_whole, value: string) => {
      const v = value.toLowerCase();
      if (v[0] === '#') {
        const hex = v[1] === 'x';
        const point = Number.parseInt(v.slice(hex ? 2 : 1), hex ? 16 : 10);
        return Number.isFinite(point) && point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '';
      }
      return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' } as Record<string, string>)[v] ?? '';
    })
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n[ \t]*/g, '\n')
    .trim();
}
