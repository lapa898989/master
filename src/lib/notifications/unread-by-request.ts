export function extractRequestIdFromHref(href: string): number | null {
  // Expected: /client/requests/<id> or /chat/<id>
  const m = href.match(/\/(client\/requests|chat)\/(\d+)\b/);
  if (!m) return null;
  const id = Number(m[2]);
  return Number.isFinite(id) ? id : null;
}

export function countUnreadByRequestId(hrefs: Array<{ href: string }>): Map<number, number> {
  const m = new Map<number, number>();
  for (const row of hrefs) {
    const requestId = extractRequestIdFromHref(row.href);
    if (!requestId) continue;
    m.set(requestId, (m.get(requestId) ?? 0) + 1);
  }
  return m;
}

