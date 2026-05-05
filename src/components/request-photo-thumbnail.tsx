/* eslint-disable @next/next/no-img-element -- URLs from users; hosts are not known for next/image remotePatterns */
export function RequestPhotoThumbnail({ src }: { src: string }) {
  return <img src={src} alt="Фото заявки" className="h-36 w-full object-cover" />;
}
