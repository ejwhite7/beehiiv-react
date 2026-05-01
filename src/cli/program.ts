/**
 * CLI program factory.
 * Exports the `createProgram` function used by the CLI entry point
 * and unit tests. Separated from `index.ts` so that importing the
 * factory does not trigger `program.parse()`.
 * @module cli/program
 */

import { Command } from 'commander';
import { runInit } from './commands/init.js';
import { runSync } from './commands/sync.js';
import { runAddBlog } from './commands/add-blog.js';

/**
 * The package version string, injected at build time by tsup's `define`
 * option.  See the `define` field in `tsup.config.ts` for the source
 * mapping (`__PACKAGE_VERSION__` -> `pkg.version`).
 */
declare const __PACKAGE_VERSION__: string;

/**
 * Create and configure the CLI program.
 *
 * Sets up the Commander.js program with `init` and `sync` commands,
 * reads the package version, and configures error handling.
 *
 * @returns The configured Commander program
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name('beehiiv-react')
    .description(
      'CLI tools for beehiiv-react — scaffold config, types, and API routes for your Next.js project',
    )
    .version(
      `beehiiv-react/${__PACKAGE_VERSION__}`,
      '-v, --version',
      'Print the beehiiv-react version',
    );

  program
    .command('init')
    .description('Initialize beehiiv-react in your project')
    .option('--oauth', 'Use OAuth2 authentication flow instead of API key')
    .option(
      '--output-dir <dir>',
      'Output directory for generated files',
      '.',
    )
    .option(
      '--blog',
      'Also scaffold blog reader pages (index, [slug], RSS, sitemap). Off by default.',
    )
    .option(
      '--blog-route <prefix>',
      'Route prefix for the blog (no leading slash). Implies --blog.',
    )
    .option('--blog-title <title>', 'Blog title. Implies --blog.')
    .option(
      '--blog-description <description>',
      'Blog description. Implies --blog.',
    )
    .action(
      async (options: {
        oauth?: boolean;
        outputDir?: string;
        blog?: boolean;
        blogRoute?: string;
        blogTitle?: string;
        blogDescription?: string;
      }) => {
        try {
          // Any --blog-* flag implies --blog, so users don't have to repeat it.
          const blog =
            options.blog === true ||
            options.blogRoute !== undefined ||
            options.blogTitle !== undefined ||
            options.blogDescription !== undefined;
          await runInit({
            oauth: options.oauth,
            outputDir: options.outputDir,
            blog,
            blogRoute: options.blogRoute,
            blogTitle: options.blogTitle,
            blogDescription: options.blogDescription,
          });
        } catch (error: unknown) {
          await handleError(error);
        }
      },
    );

  // `add` command group — lets users opt in to features after init.
  const add = program
    .command('add')
    .description('Add an optional feature to an already-initialised project');

  add
    .command('blog')
    .description(
      'Scaffold blog reader pages (index, [slug], RSS, sitemap) into app/<route>/',
    )
    .option(
      '--output-dir <dir>',
      'Output directory where generated files live',
      '.',
    )
    .option(
      '--route <prefix>',
      'Route prefix for the blog (no leading slash)',
      'blog',
    )
    .option('--title <title>', 'Blog title')
    .option('--description <description>', 'Blog description')
    .option('-y, --yes', 'Skip prompts and use defaults / flags')
    .action(
      async (options: {
        outputDir?: string;
        route?: string;
        title?: string;
        description?: string;
        yes?: boolean;
      }) => {
        try {
          await runAddBlog({
            outputDir: options.outputDir,
            route: options.route,
            title: options.title,
            description: options.description,
            yes: options.yes,
          });
        } catch (error: unknown) {
          await handleError(error);
        }
      },
    );

  program
    .command('sync')
    .description(
      'Sync custom field types from beehiiv (regenerates types only)',
    )
    .option(
      '--output-dir <dir>',
      'Output directory where generated files live',
      '.',
    )
    .action(async (options: { outputDir?: string }) => {
      try {
        await runSync({
          outputDir: options.outputDir,
        });
      } catch (error: unknown) {
        await handleError(error);
      }
    });

  return program;
}

/**
 * Handle errors from command execution.
 * Prints the error message in red and exits with code 1.
 *
 * @param error - The error that occurred
 */
async function handleError(error: unknown): Promise<never> {
  const { default: chalk } = await import('chalk');

  const message =
    error instanceof Error ? error.message : String(error);
  console.error(chalk.red(`\nError: ${message}\n`));
  process.exit(1);
}
