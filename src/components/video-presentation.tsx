function parseYoutubeEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id && /^[a-zA-Z0-9_-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}?rel=0` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{6,}$/.test(v)) {
        return `https://www.youtube.com/embed/${v}?rel=0`;
      }
      const m = u.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{6,})/);
      if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;
    }
  } catch {
    return null;
  }
  return null;
}

export function VideoPresentation() {
  const envUrl = process.env.NEXT_PUBLIC_PRESENTATION_VIDEO_URL?.trim();
  const youtubeEmbed = envUrl ? parseYoutubeEmbedUrl(envUrl) : null;

  if (youtubeEmbed) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-black/5 shadow-[0_20px_60px_rgba(2,6,23,0.12)]">
        <div className="relative aspect-video w-full">
          <iframe
            title="Видеопрезентация ServiceDrive"
            src={youtubeEmbed}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  const fileSrc = envUrl && !youtubeEmbed ? envUrl : undefined;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-950 shadow-[0_20px_60px_rgba(2,6,23,0.12)]">
      <video
        controls
        playsInline
        className="absolute inset-0 h-full w-full object-contain"
        preload="metadata"
        poster="/videos/presentation-poster.svg"
      >
        {fileSrc ? (
          <source src={fileSrc} />
        ) : (
          <>
            <source src="/videos/presentation.mp4" type="video/mp4" />
            <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm" type="video/webm" />
          </>
        )}
        Ваш браузер не воспроизводит видео. Откройте страницу в другом браузере или обновите его.
      </video>
    </div>
  );
}
