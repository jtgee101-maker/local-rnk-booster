// Optimized Image Component with WebP support
import React, { useState } from 'react';

/**
 * OptimizedImage - Automatic WebP with fallback
 * 
 * Usage:
 * <OptimizedImage 
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   className="w-full h-auto"
 *   sizes="(max-width: 768px) 100vw, 50vw"
 * />
 */

export function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  sizes = '100vw',
  loading = 'lazy',
  ...props 
}) {
  const [error, setError] = useState(false);
  
  // Generate WebP source
  const webpSrc = src.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
  
  // Generate srcset for responsive images
  const srcSet = [640, 768, 1024, 1280, 1920]
    .map(width => `${src.replace(/\.(jpg|jpeg|png|gif)$/i, `-${width}w.webp`)} ${width}w`)
    .join(', ');

  if (error) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`} {...props}>
        <span className="text-gray-400 text-sm">Image failed to load</span>
      </div>
    );
  }

  return (
    <picture>
      {/* WebP sources */}
      <source 
        srcSet={srcSet} 
        sizes={sizes}
        type="image/webp"
      />
      {/* Fallback to original format */}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        onError={() => setError(true)}
        {...props}
      />
    </picture>
  );
}

// Lazy image with blur placeholder
export function LazyImage({ 
  src, 
  alt, 
  placeholderSrc,
  className = '',
  ...props 
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {/* Blur placeholder */}
      {placeholderSrc && !loaded && (
        <img
          src={placeholderSrc}
          alt=""
          className={`${className} absolute inset-0 blur-lg scale-110`}
          aria-hidden="true"
        />
      )}
      {/* Main image */}
      <OptimizedImage
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        {...props}
      />
    </div>
  );
}
