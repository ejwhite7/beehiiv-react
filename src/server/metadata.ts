/**
 * Helpers for producing Next.js `Metadata` objects from beehiiv posts.
 * These are pure functions \u2014 safe in any RSC, route handler, or
 * `generateMetadata` export.
 *
 * The return type is intentionally a structural subset of Next.js's
 * `Metadata` interface so this module does not need a `next` dependency.
 *
 * @module server/metadata
 */

import type { PostInfo } from '../types/post.js';

/**
 * Minimal structural shape compatible with Next.js's `Metadata` type.
 * We avoid importing from `next` to keep this package framework-agnostic.
 */
export interface PostMetadata {
  title?: string;
  description?: string;
  openGraph?: {
    title?: string;
    description?: string;
    type?: 'article';
    publishedTime?: string;
    images?: { url: string }[];
    url?: string;
  };
  twitter?: {
    card?: 'summary_large_image' | 'summary';
    title?: string;
    description?: string;
    images?: string[];
  };
  alternates?: { canonical?: string };
}

/**
 * Build a Next.js-compatible metadata object from a {@link PostInfo}.
 *
 * @param post - The post to build metadata for
 * @param options - Optional canonical URL and site overrides
 *
 * @example
 * ```ts
 * // app/blog/[slug]/page.tsx
 * export async function generateMetadata({ params }) {
 *   const { slug } = await params;
 *   const post = await fetchPostBySlug(client, pubId, slug);
 *   if (!post) return {};
 *   return generatePostMetadata(post, { canonicalUrl: `https://site.com/blog/${slug}` });
 * }
 * ```
 */
export function generatePostMetadata(
  post: PostInfo,
  options?: {
    /** Canonical URL for this post on the consumer's site */
    canonicalUrl?: string;
    /** Override the OG/Twitter title (defaults to post.title) */
    title?: string;
    /** Override the OG/Twitter description (defaults to post.subtitle or meta_description) */
    description?: string;
  },
): PostMetadata {
  const title = options?.title ?? post.title ?? '';
  const description = options?.description ?? post.subtitle ?? '';
  const image = post.thumbnail_url ?? undefined;
  const publishedTime =
    post.publish_date != null
      ? new Date(post.publish_date * 1000).toISOString()
      : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      images: image ? [{ url: image }] : undefined,
      url: options?.canonicalUrl,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: options?.canonicalUrl
      ? { canonical: options.canonicalUrl }
      : undefined,
  };
}
