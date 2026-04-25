const prefetchedImages = new Set<string>();

export function prefetchImages(urls: Array<string | undefined | null>) {
  if (typeof window === 'undefined') return;

  urls
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    .forEach((url) => {
      if (prefetchedImages.has(url)) return;
      prefetchedImages.add(url);

      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    });
}
