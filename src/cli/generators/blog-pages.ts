/**
 * Blog page generator for the beehiiv CLI.
 *
 * Scaffolds a complete `/{routePrefix}` blog reader on top of the user's
 * existing Next.js App Router project:
 *
 *   - `app/{routePrefix}/page.tsx`             \u2014 index listing
 *   - `app/{routePrefix}/[slug]/page.tsx`      \u2014 post detail (slug-based)
 *   - `app/{routePrefix}/rss.xml/route.ts`     \u2014 RSS 2.0 feed
 *   - `app/{routePrefix}/sitemap.ts`           \u2014 Next.js sitemap
 *
 * @module cli/generators/blog-pages
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';
import { escapeTsString, writeFileWithConfirm } from './utils.js';

/** Data required to generate the blog pages */
export interface BlogPagesGeneratorData {
  /** The output directory to write into */
  outputDir: string;
  /** The publication ID to embed as a fallback in generated files */
  publicationId: string;
  /** The route prefix (e.g. "blog", "newsletter", "posts") \u2014 no leading slash */
  routePrefix: string;
  /** Title shown on the index page and in RSS / metadata */
  blogTitle: string;
  /** Description shown on the index page and in RSS / metadata */
  blogDescription: string;
}

/** Mapping of template file -> output path segments under app/ */
const TEMPLATES: Array<{ template: string; outputPath: string[] }> = [
  { template: 'blog-index-page.tsx.hbs', outputPath: ['page.tsx'] },
  { template: 'blog-post-page.tsx.hbs', outputPath: ['[slug]', 'page.tsx'] },
  { template: 'blog-rss-route.ts.hbs', outputPath: ['rss.xml', 'route.ts'] },
  { template: 'blog-sitemap.ts.hbs', outputPath: ['sitemap.ts'] },
];

/**
 * Generate the blog page files from Handlebars templates.
 *
 * If a target file already exists the user is prompted (via
 * {@link confirmOverwrite}) before it is replaced.
 *
 * @param data - Generator inputs
 *
 * @example
 * ```ts
 * await generateBlogPages({
 *   outputDir: '.',
 *   publicationId: 'pub_abc',
 *   routePrefix: 'blog',
 *   blogTitle: 'Acme Newsletter',
 *   blogDescription: 'Weekly product updates from Acme.',
 * });
 * ```
 */
export async function generateBlogPages(
  data: BlogPagesGeneratorData,
): Promise<void> {
  const view = {
    publicationId: data.publicationId,
    routePrefix: data.routePrefix,
    // HTML-escaped by Handlebars — for JSX text positions
    blogTitle: data.blogTitle,
    blogDescription: data.blogDescription,
    // Pre-escaped for single-quoted TS string literal positions,
    // rendered with {{{...}}} in the templates
    blogTitleTs: escapeTsString(data.blogTitle),
    blogDescriptionTs: escapeTsString(data.blogDescription),
  };

  for (const entry of TEMPLATES) {
    const templatePath = path.resolve(
      __dirname,
      '..',
      '..',
      'templates',
      entry.template,
    );

    const source = fs.readFileSync(templatePath, 'utf-8');
    const compiled = Handlebars.compile(source);
    const output = compiled(view);

    const outputPath = path.join(
      data.outputDir,
      'app',
      data.routePrefix,
      ...entry.outputPath,
    );

    await writeFileWithConfirm(outputPath, output);
  }
}
