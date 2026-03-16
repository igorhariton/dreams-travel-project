import React, { useState } from "react";

interface ProgressiveImageProps {
  src: string;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
}

export function ProgressiveImage({ src, alt, className, wrapperClassName }: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-300" />
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${className} transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}