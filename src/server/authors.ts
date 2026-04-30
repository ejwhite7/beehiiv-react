/**
 * Pure async data-fetching functions for Authors in React Server Components (RSC).
 *
 * Every function in this module is a plain async function — no React hooks,
 * no `useState`, no `useEffect`. They are safe to call directly inside
 * Server Components, Route Handlers, Server Actions, or any Node.js context.
 *
 * Each function accepts a {@link BeehiivClient} as its first argument and
 * returns **unwrapped** data (the inner `data` array / object from the API
 * response envelope) so consumers never have to drill into `{ data: ... }`.
 *
 * @module server/authors
 */

import type { BeehiivClient } from '../client/index.js';
import type { Author } from '../types/author.js';
import type { ListAuthorsOptions } from '../client/endpoints/authors.js';

/**
 * Fetch a paginated list of authors for a publication.
 *
 * Calls {@link BeehiivClient.authors.list} and returns the unwrapped `data`
 * array, discarding the pagination envelope.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID (starts with `"pub_"`)
 * @param options - Optional pagination parameters
 * @returns An array of {@link Author} objects
 *
 * @example
 * ```ts
 * const authors = await fetchAuthors(client, 'pub_abc', { limit: 20 });
 * ```
 */
export async function fetchAuthors(
  client: BeehiivClient,
  publicationId: string,
  options?: ListAuthorsOptions,
): Promise<Author[]> {
  const response = await client.authors.list(publicationId, options);
  return response.data ?? [];
}

/**
 * Fetch a single author by their ID.
 *
 * Calls {@link BeehiivClient.authors.get} and returns the unwrapped `data`
 * object from the API response envelope.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID (starts with `"pub_"`)
 * @param authorId - The author ID (starts with `"author_"`)
 * @returns The {@link Author} for the requested author
 *
 * @example
 * ```ts
 * const author = await fetchAuthor(client, 'pub_abc', 'author_123');
 * ```
 */
export async function fetchAuthor(
  client: BeehiivClient,
  publicationId: string,
  authorId: string,
): Promise<Author> {
  const response = await client.authors.get(publicationId, authorId);
  return response.data;
}
