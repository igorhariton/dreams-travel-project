import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  className?: string;
  showIndicators?: boolean;
}

export function ImageCarousel({ images, className = '', showIndicators = true }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent(c => (c - 1 + images.length) % images.length);
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent(c => (c + 1) % images.length);
  };

  const handleImageError = (index: number) => {
    setFailedImages(prev => new Set(prev).add(index));
  };

  // Autoplay: advance to the next image every 5 seconds, looping back to start
  useEffect(() => {
    if (!images || images.length <= 1) return;
    const id = setInterval(() => {
      setCurrent(c => (c + 1) % images.length);
    }, 5000);
    return () => clearInterval(id);
  }, [images.length]);

  // Clamp current index if `images` array changes and length becomes smaller
  useEffect(() => {
    if (!images || images.length === 0) {
      setCurrent(0);
    } else {
      setCurrent(c => c % images.length);
    }
  }, [images.length]);

const fallbackForIndex = (i: number) => `/images/_fallback/${(i % images.length) + 1}.jpg`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Images */}
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={failedImages.has(i) ? fallbackForIndex(i) : img}
            alt={`slide-${i}`}
            className="w-full h-full object-cover shrink-0"
            style={{ minWidth: '100%' }}
            onError={() => handleImageError(i)}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      {isHovered && images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center hover:bg-white transition-all z-10"
          >
            <ChevronLeft size={16} className="text-gray-700" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center hover:bg-white transition-all z-10"
          >
            <ChevronRight size={16} className="text-gray-700" />
          </button>
        </>
      )}

      {/* Indicator dots */}
      {showIndicators && images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-5 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      {/* Image counter */}
      <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full z-10">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}
