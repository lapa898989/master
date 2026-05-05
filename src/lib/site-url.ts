/**
 * Канонический origin сайта: прод (Vercel), кастомный домен или локальная разработка.
 * На Vercel задайте NEXT_PUBLIC_SITE_URL после первого деплоя (например https://xxx.vercel.app)
 * или полагайтесь на автоматический VERCEL_URL.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}
