import React, { useState, useCallback, useRef, memo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  className?: string;
  showIndicators?: boolean;
  label?: string;
}

const NavButton = memo(({ direction, onClick }: {
  direction: 'prev' | 'next';
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    onClick={onClick}
    aria-label={direction === 'prev' ? 'Previous image' : 'Next image'}
    className={`absolute ${direction === 'prev' ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors z-10`}
  >
    {direction === 'prev'
      ? <ChevronLeft size={16} className="text-gray-700" />
      : <ChevronRight size={16} className="text-gray-700" />}
  </button>
));
NavButton.displayName = 'NavButton';

export const ImageCarousel = memo(function ImageCarousel({
  images,
  className = '',
  showIndicators = true,
  label,
}: ImageCarouselProps) {
  const len = images.length;
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  // Only indices that have been navigated to are loaded into DOM
  const [loadedSet, setLoadedSet] = useState<Set<number>>(() => new Set([0]));
  // Track which images finished loading (to avoid white flash)
  const [readySet, setReadySet] = useState<Set<number>>(new Set());
  const failedRef = useRef<Set<number>>(new Set());
  const [, forceUpdate] = useState(0);

  const safeCurrent = len > 0 ? current % len : 0;
  const hasMultiple = len > 1;

  // When navigating, add prev+current+next to loadedSet
  useEffect(() => {
    if (!len) return;
    const needed = safeCurrent === 0
      ? [safeCurrent]
      : [
          safeCurrent,
          (safeCurrent + 1) % len,
          (safeCurrent - 1 + len) % len,
        ];
    setLoadedSet(s => {
      const missing = needed.filter(i => !s.has(i));
      if (!missing.length) return s;
      const next = new Set(s);
      missing.forEach(i => next.add(i));
      return next;
    });
  }, [safeCurrent, len]);

  const prev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent(c => (c - 1 + len) % len);
  }, [len]);

  const next = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent(c => (c + 1) % len);
  }, [len]);

  const goTo = useCallback((e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    setCurrent(i);
  }, []);

  const handleLoad = useCallback((index: number) => {
    setReadySet(s => {
      if (s.has(index)) return s;
      const next = new Set(s);
      next.add(index);
      return next;
    });
  }, []);

  const handleImageError = useCallback((index: number) => {
    if (!failedRef.current.has(index)) {
      failedRef.current.add(index);
      // treat error as "ready" so placeholder disappears
      setReadySet(s => {
        const next = new Set(s);
        next.add(index);
        return next;
      });
      forceUpdate(n => n + 1);
    }
  }, []);

  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);

  if (!len) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Slide strip */}
      <div
        className="flex h-full"
        style={{
          transform: `translateX(-${safeCurrent * 100}%)`,
          transition: 'transform 500ms ease-in-out',
          willChange: 'transform',
        }}
      >
        {images.map((img, i) => {
          const isLoaded = loadedSet.has(i);
          const isReady = readySet.has(i);
          const src = failedRef.current.has(i)
            ? `/images/_fallback/${(i % len) + 1}.jpg`
            : img;

          return (
            <div
              key={img}
              className="relative shrink-0 bg-gray-200"
              style={{ minWidth: '100%', height: '100%' }}
            >
              {/* Skeleton shimmer — visible until image is ready */}
              {!isReady && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
              )}

              {/* Image — only in DOM when needed, fades in when ready */}
              {isLoaded && (
                <img
                  src={src}
                  alt={label ? `${label} ${i + 1}` : `slide-${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="auto"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                  style={{ opacity: isReady ? 1 : 0 }}
                  onLoad={() => handleLoad(i)}
                  onError={() => handleImageError(i)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Location label */}
      {label && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-6 z-10 pointer-events-none">
          <span className="text-white text-sm font-semibold drop-shadow">{label}</span>
        </div>
      )}

      {/* Nav arrows */}
      {isHovered && hasMultiple && (
        <>
          <NavButton direction="prev" onClick={prev} />
          <NavButton direction="next" onClick={next} />
        </>
      )}

      {/* Indicator dots */}
      {showIndicators && hasMultiple && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => goTo(e, i)}
              aria-label={`Slide ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${
                i === safeCurrent
                  ? 'w-5 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full z-10 pointer-events-none">
        {safeCurrent + 1} / {len}
      </div>
    </div>
  );
});
ImageCarousel.displayName = 'ImageCarousel';
