/**
 * The `init` command for beehiiv-react CLI.
 * Scaffolds configuration, types, API routes, and server actions in the
 * user's Next.js project. Guides the user through authentication, publication
 * selection, and feature selection via interactive prompts.
 * @module cli/commands/init
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PublicationInfo } from '../../types/publication.js';
import type { CustomFieldInfo } from '../../types/custom-field.js';
import { promptForApiKey } from '../auth/api-key.js';
import { runOAuthFlow } from '../auth/oauth.js';
import { selectPublication, selectFeatures, resolveBlogConfig } from '../prompts/index.js';
import { generateBlogPages } from '../generators/blog-pages.js';
import { scaffoldIntegration } from '../scaffold.js';

/** Options for the init command */
export interface InitOptions {
  /** Whether to use OAuth2 instead of API key auth */
  oauth?: boolean;
  /** Output directory for generated files (default: current directory) */
  outputDir?: string;
  /**
   * Opt-in: also scaffold blog reader pages (index, [slug], RSS, sitemap)
   * under the configured route prefix. When omitted, no blog files are
   * generated and the user is never prompted about them.
   */
  blog?: boolean;
  /** Route prefix for the blog (no leading slash). Defaults to `"blog"`. */
  blogRoute?: string;
  /** Title for the blog. Defaults to the publication name. */
  blogTitle?: string;
  /** Description for the blog. */
  blogDescription?: string;
}

/** Environment variable name for the OAuth client ID */
const BEEHIIV_OAUTH_CLIENT_ID_ENV = 'BEEHIIV_OAUTH_CLIENT_ID';

/** beehiiv API v2 base URL */
const BEEHIIV_API_BASE = 'https://api.beehiiv.com/v2';

/**
 * Print the CLI welcome banner.
 *
 * @param chalk - The chalk module for colored output
 */
async function printBanner(): Promise<void> {
  const { default: chalk } = await import('chalk');

  console.log('');
  console.log(
    chalk.cyan.bold(
      '  ____            _     _ _         ____                 _   ',
    ),
  );
  console.log(
    chalk.cyan.bold(
      ' | __ )  ___  ___| |__ (_|_)_   __/ ___|  ___  __ _  ___| |_ ',
    ),
  );
  console.log(
    chalk.cyan.bold(
      " |  _ \\ / _ \\/ _ \\ '_ \\| | \\ \\ / / |___ / _ \\/ _` |/ __| __|",
    ),
  );
  console.log(
    chalk.cyan.bold(
      ' | |_) |  __/  __/ | | | | |\\ V /|  ___|  __/ (_| | (__| |_ ',
    ),
  );
  console.log(
    chalk.cyan.bold(
      ' |____/ \\___|\\___|_| |_|_|_| \\_/ |_|    \\___|\\__,_|\\___|\\__|',
    ),
  );
  console.log('');
  console.log(
    chalk.white.bold('  beehiiv-react') +
      chalk.gray(' — Connect beehiiv to your Next.js project'),
  );
  console.log('');
}

/**
 * Fetch custom fields for a publication from the beehiiv API.
 *
 * @param publicationId - The publication ID to fetch fields for
 * @param authToken - The API key or OAuth access token
 * @returns Array of custom field definitions
 */
async function fetchCustomFields(
  publicationId: string,
  authToken: string,
): Promise<CustomFieldInfo[]> {
  const { default: ora } = await import('ora');
  const { default: chalk } = await import('chalk');

  const spinner = ora('Fetching custom fields...').start();

  const response = await fetch(
    `${BEEHIIV_API_BASE}/publications/${publicationId}/custom_fields`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    spinner.fail(chalk.red('Failed to fetch custom fields.'));
    throw new Error(
      `Failed to fetch custom fields: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as { data: CustomFieldInfo[] };
  const fields = body.data;

  spinner.succeed(
    chalk.green(
      `Found ${fields.length} custom field${fields.length === 1 ? '' : 's'}.`,
    ),
  );

  return fields;
}

/**
 * Append an environment variable to `.env.local` if not already present.
 *
 * @param outputDir - The directory containing .env.local
 * @param key - The environment variable name
 * @param value - The value to set
 */
function appendToEnvLocal(
  outputDir: string,
  key: string,
  value: string,
): void {
  const envPath = path.join(outputDir, '.env.local');
  let content = '';

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8');
    if (content.includes(`${key}=`)) {
      return;
    }
    if (!content.endsWith('\n')) {
      content += '\n';
    }
  }

  content += `${key}=${value}\n`;
  fs.writeFileSync(envPath, content, 'utf-8');
}

/**
 * Run the `beehiiv-react init` command.
 *
 * Full initialization flow:
 * 1. Print a welcome banner
 * 2. Authenticate via OAuth (if `--oauth`) or API key
 * 3. Select a target publication from the authenticated account
 * 4. Fetch custom field definitions for the selected publication
 * 5. Select features to generate (API routes, server actions)
 * 6. Generate files: config, custom field types, and optionally API routes and server actions
 * 7. Update `.env.local` with the API key or access token
 * 8. Print a success summary and next steps
 *
 * @param options - Command options including auth method and output directory
 * @throws {Error} If authentication fails, API calls fail, or file generation fails
 *
 * @example
 * ```ts
 * await runInit({ oauth: false, outputDir: '.' });
 * ```
 */
export async function runInit(options: InitOptions): Promise<void> {
  const { default: chalk } = await import('chalk');

  const outputDir = options.outputDir ?? '.';

  await printBanner();

  // --- Step 1: Authentication ---
  let authToken: string;
  let publications: PublicationInfo[];
  let isOAuth = false;

  if (options.oauth) {
    const clientId = process.env[BEEHIIV_OAUTH_CLIENT_ID_ENV];

    if (!clientId) {
      console.log(
        chalk.yellow(
          `\nOAuth client ID not found. Set the ${BEEHIIV_OAUTH_CLIENT_ID_ENV} environment variable.`,
        ),
      );
      console.log(
        chalk.yellow('Falling back to API key authentication...\n'),
      );
      const result = await promptForApiKey();
      authToken = result.apiKey;
      publications = result.publications;
    } else {
      const tokens = await runOAuthFlow(clientId);
      authToken = tokens.accessToken;
      isOAuth = true;

      // Fetch publications with the OAuth token
      const response = await fetch(`${BEEHIIV_API_BASE}/publications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch publications: ${response.status} ${response.statusText}`,
        );
      }

      const body = (await response.json()) as { data: PublicationInfo[] };
      publications = body.data;
    }
  } else {
    const result = await promptForApiKey();
    authToken = result.apiKey;
    publications = result.publications;
  }

  // --- Step 2: Select publication ---
  console.log('');
  const publication = await selectPublication(publications);
  console.log(
    chalk.cyan(`\nConfiguring for: ${publication.name} (${publication.id})`),
  );

  // --- Step 3: Fetch custom fields ---
  console.log('');
  const customFields = await fetchCustomFields(publication.id, authToken);

  // --- Step 4: Select features ---
  console.log('');
  const features = await selectFeatures();

  // --- Step 5: Generate files ---
  console.log(chalk.cyan('\nGenerating files...\n'));

  const generatedFiles = await scaffoldIntegration({
    outputDir,
    publicationId: publication.id,
    publicationName: publication.name,
    customFields,
    features,
  });

  // --- Optional: blog reader pages ---
  // Only scaffolded when the caller explicitly opts in via `--blog`.
  // No prompt is shown otherwise — keeps `init` non-invasive for users
  // who want to host beehiiv content on a custom route or not at all.
  if (options.blog) {
    console.log('');
    // Resolves to non-interactive when --blog-route/-title/-description are
    // all supplied (route prefix is normalized + validated the same way as
    // the interactive prompt); otherwise prompts.
    const blogConfig = await resolveBlogConfig({
      route: options.blogRoute,
      title: options.blogTitle,
      description: options.blogDescription,
      publicationName: publication.name,
    });
    await generateBlogPages({
      outputDir,
      publicationId: publication.id,
      routePrefix: blogConfig.routePrefix,
      blogTitle: blogConfig.blogTitle,
      blogDescription: blogConfig.blogDescription,
    });
    generatedFiles.push(
      path.join(outputDir, 'app', blogConfig.routePrefix, 'page.tsx'),
      path.join(outputDir, 'app', blogConfig.routePrefix, '[slug]', 'page.tsx'),
      path.join(outputDir, 'app', blogConfig.routePrefix, 'rss.xml', 'route.ts'),
      path.join(outputDir, 'app', blogConfig.routePrefix, 'sitemap.ts'),
    );
  }

  // --- Step 6: Update .env.local ---
  if (isOAuth) {
    appendToEnvLocal(outputDir, 'BEEHIIV_ACCESS_TOKEN', authToken);
  } else {
    appendToEnvLocal(outputDir, 'BEEHIIV_API_KEY', authToken);
  }
  console.log(chalk.green('  Updated .env.local'));

  // --- Step 7: Success summary ---
  console.log(chalk.green.bold('\nSetup complete!\n'));
  console.log(chalk.white('Generated files:'));
  for (const file of generatedFiles) {
    console.log(chalk.gray(`  - ${file}`));
  }

  // --- Step 8: Next steps ---
  console.log(chalk.cyan.bold('\nNext steps:\n'));
  console.log(
    chalk.white('  1. Add the BeehiivProvider to your root layout:'),
  );
  console.log(
    chalk.gray(`
     import { BeehiivProvider } from 'beehiiv-react';

     export default function RootLayout({ children }) {
       return (
         <BeehiivProvider publicationId="${publication.id}">
           {children}
         </BeehiivProvider>
       );
     }
  `),
  );
  console.log(
    chalk.white('  2. Import and use the hooks in your components:'),
  );
  console.log(
    chalk.gray(`
     import { useSubscribe, useCustomFields } from 'beehiiv-react';
  `),
  );
  console.log(
    chalk.white(
      '  3. Run ' +
        chalk.cyan('npx beehiiv-react sync') +
        chalk.white(' whenever you update custom fields in beehiiv.'),
    ),
  );
  console.log('');
}
