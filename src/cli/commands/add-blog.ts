/**
 * The `add blog` command for beehiiv-react CLI.
 *
 * Scaffolds the blog reader pages (index, [slug], RSS, sitemap) into an
 * existing project that has already been initialised with
 * `beehiiv-react init`. Reads the publication ID from `beehiiv.config.ts`
 * when available; otherwise prompts for it.
 *
 * Designed so users can adopt the blog feature later without re-running
 * the full `init` flow (which would re-prompt for unrelated features).
 *
 * @module cli/commands/add-blog
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { promptForApiKey } from '../auth/api-key.js';
import { selectPublication, promptForBlogConfig } from '../prompts/index.js';
import { generateBlogPages } from '../generators/blog-pages.js';

/** Options for the `add blog` command */
export interface AddBlogOptions {
  /** Output directory for generated files (default: current directory) */
  outputDir?: string;
  /** Route prefix for the blog (no leading slash). Defaults to `"blog"`. */
  route?: string;
  /** Title for the blog. */
  title?: string;
  /** Description for the blog. */
  description?: string;
  /**
   * Skip all interactive prompts. Requires `route`, `title`, and
   * `description` to be supplied via flags, and a publication ID to be
   * resolvable from `beehiiv.config.ts`.
   */
  yes?: boolean;
}

/**
 * Read the publication ID from `beehiiv.config.ts` if it exists.
 *
 * Mirrors the parsing logic used by the `sync` command so we don't pull
 * in a TypeScript loader.
 */
function readPublicationIdFromConfig(outputDir: string): string | null {
  const configPath = path.join(outputDir, 'beehiiv.config.ts');
  if (!fs.existsSync(configPath)) return null;
  const content = fs.readFileSync(configPath, 'utf-8');
  const match = content.match(/publicationId:\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

/**
 * Read the publication name from `beehiiv.config.ts` if available.
 */
function readPublicationNameFromConfig(outputDir: string): string | null {
  const configPath = path.join(outputDir, 'beehiiv.config.ts');
  if (!fs.existsSync(configPath)) return null;
  const content = fs.readFileSync(configPath, 'utf-8');
  const match = content.match(/publicationName:\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

/**
 * Run the `beehiiv-react add blog` command.
 *
 * Resolution order for publication ID:
 *   1. `beehiiv.config.ts` (preferred; written by `init`)
 *   2. Interactive API-key prompt + publication selection (fallback)
 *
 * @param options - Command options
 */
export async function runAddBlog(options: AddBlogOptions): Promise<void> {
  const { default: chalk } = await import('chalk');
  const outputDir = options.outputDir ?? '.';

  // --- Resolve publication ID + name ---
  let publicationId = readPublicationIdFromConfig(outputDir);
  let publicationName = readPublicationNameFromConfig(outputDir) ?? 'Newsletter';

  if (!publicationId) {
    if (options.yes) {
      throw new Error(
        'Could not resolve publicationId. Run `beehiiv-react init` first or pass --route/--title/--description with a publicationId in beehiiv.config.ts.',
      );
    }
    console.log(
      chalk.yellow(
        'No beehiiv.config.ts found \u2014 falling back to API key auth to select a publication.',
      ),
    );
    const result = await promptForApiKey();
    const publication = await selectPublication(result.publications);
    publicationId = publication.id;
    publicationName = publication.name;
  } else {
    console.log(
      chalk.cyan(
        `Using publication from beehiiv.config.ts: ${publicationName} (${publicationId})`,
      ),
    );
  }

  // --- Resolve blog config ---
  const fullyConfigured =
    options.route !== undefined &&
    options.title !== undefined &&
    options.description !== undefined;

  const blogConfig =
    fullyConfigured || options.yes
      ? {
          routePrefix: (options.route ?? 'blog').replace(/^\/+|\/+$/g, ''),
          blogTitle: options.title ?? publicationName,
          blogDescription:
            options.description ?? `Latest posts from ${publicationName}.`,
        }
      : await promptForBlogConfig({
          routePrefix: options.route,
          blogTitle: options.title ?? publicationName,
          blogDescription:
            options.description ?? `Latest posts from ${publicationName}.`,
        });

  // --- Generate ---
  console.log(chalk.cyan('\nGenerating blog pages...\n'));
  await generateBlogPages({
    outputDir,
    publicationId,
    routePrefix: blogConfig.routePrefix,
    blogTitle: blogConfig.blogTitle,
    blogDescription: blogConfig.blogDescription,
  });

  console.log(chalk.green.bold('\nBlog scaffolded.\n'));
  console.log(
    chalk.white(`  Open http://localhost:3000/${blogConfig.routePrefix} after \`next dev\`.`),
  );
  console.log(
    chalk.gray(
      `  Files live under app/${blogConfig.routePrefix}/ \u2014 edit freely.`,
    ),
  );
}
