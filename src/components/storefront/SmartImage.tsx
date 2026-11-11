'use client';

import { useState } from 'react';
import Image, { type ImageProps, type StaticImageData } from 'next/image';

/**
 * Hosts allowed in `images.remotePatterns` (next.config.ts). Keep in sync.
 * Anything else is rendered as a plain lazy <img> so it still works.
 */
const OPTIMIZABLE_HOSTS = ['cdn.gentlepark.com'];
const OPTIMIZABLE_HOST_SUFFIXES = ['.public.blob.vercel-storage.com', '.blob.vercel-storage.com'];

/** Can next/image's default loader optimise this src with the current config? */
export function canOptimize(src: string): boolean {
  if (!src) return false;
  // Local path: Next 16 rejects local srcs with query strings unless localPatterns allow them.
  if (src.startsWith('/') && !src.startsWith('//')) return !src.includes('?');
  try {
    const url = new URL(src);
    if (url.protocol !== 'https:' || url.port) return false;
    const host = url.hostname;
    return (
      OPTIMIZABLE_HOSTS.includes(host) ||
      OPTIMIZABLE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix) || host === suffix.replace(/^\./, ''))
    );
  } catch {
    return false; // data:, blob:, malformed, protocol-relative, etc.
  }
}

type SmartImageProps = Omit<ImageProps, 'src'> & {
  src: string | StaticImageData;
  /** Used if the image fails to load. */
  fallbackSrc?: string;
};

/**
 * next/image when the src can be optimised, otherwise a plain <img> with
 * native lazy loading. Supports `fill` in both modes.
 */
export function SmartImage({ src, fallbackSrc, onError, ...props }: SmartImageProps) {
  const srcKey = typeof src === 'string' ? src : src.src;
  // Remember which src failed so a new src gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === srcKey;
  const resolved = failed && fallbackSrc ? fallbackSrc : src;

  const handleError: ImageProps['onError'] = (e) => {
    if (fallbackSrc && !failed) setFailedSrc(srcKey);
    onError?.(e);
  };

  if (typeof resolved !== 'string' || canOptimize(resolved)) {
    return <Image src={resolved} onError={handleError} {...props} />;
  }

  // Fallback: plain <img>. Strip next/image-only props.
  const {
    fill,
    sizes: _sizes,
    preload,
    priority,
    quality: _quality,
    placeholder: _placeholder,
    blurDataURL: _blurDataURL,
    unoptimized: _unoptimized,
    loader: _loader,
    overrideSrc: _overrideSrc,
    onLoadingComplete: _onLoadingComplete,
    loading,
    fetchPriority,
    style,
    width,
    height,
    ...rest
  } = props;
  const eager = preload || priority;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={resolved}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={loading ?? (eager ? 'eager' : 'lazy')}
      fetchPriority={fetchPriority ?? (eager ? 'high' : undefined)}
      decoding={rest.decoding ?? 'async'}
      onError={handleError}
      style={
        fill
          ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }
          : style
      }
    />
  );
}

export default SmartImage;
