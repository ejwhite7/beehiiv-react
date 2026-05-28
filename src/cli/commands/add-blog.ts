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

import { promptForApiKey } from '../auth/api-key.js';
import { selectPublication, resolveBlogConfig } from '../prompts/index.js';
import { readBeehiivConfig } from '../config.js';
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
  const config = readBeehiivConfig(outputDir);
  let publicationId = config.publicationId;
  let publicationName = config.publicationName ?? 'Newsletter';

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
  const blogConfig = await resolveBlogConfig({
    route: options.route,
    title: options.title,
    description: options.description,
    publicationName,
    yes: options.yes,
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
