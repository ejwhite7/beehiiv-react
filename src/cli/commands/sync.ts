/**
 * The `sync` command for beehiiv-react CLI.
 * Re-fetches custom field definitions from the beehiiv API and regenerates
 * the TypeScript type file without touching config, API routes, or server actions.
 * @module cli/commands/sync
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import type { CustomFieldInfo } from '../../types/custom-field.js';
import { generateCustomFieldTypes } from '../generators/custom-fields.js';

/** Options for the sync command */
export interface SyncOptions {
  /** Output directory where generated files live (default: current directory) */
  outputDir?: string;
}

/** beehiiv API v2 base URL */
const BEEHIIV_API_BASE = 'https://api.beehiiv.com/v2';

/**
 * Read the publication ID from the beehiiv config file.
 *
 * Parses the `beehiiv.config.ts` file to extract the `publicationId` value.
 * Falls back to reading `BEEHIIV_PUBLICATION_ID` from `.env.local`.
 *
 * @param outputDir - The directory containing beehiiv.config.ts
 * @returns The publication ID, or null if not found
 */
function readPublicationId(outputDir: string): string | null {
  const configPath = path.join(outputDir, 'beehiiv.config.ts');

  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8');
    const match = content.match(/publicationId:\s*['"]([^'"]+)['"]/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Read the publication name from the beehiiv config file.
 *
 * @param outputDir - The directory containing beehiiv.config.ts
 * @returns The publication name, or a fallback default
 */
function readPublicationName(outputDir: string): string {
  const configPath = path.join(outputDir, 'beehiiv.config.ts');

  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8');
    const match = content.match(/publicationName:\s*['"]([^'"]+)['"]/);
    if (match) {
      return match[1];
    }
  }

  return 'beehiiv Publication';
}

/**
 * Read the API key or access token from `.env.local`.
 *
 * @param outputDir - The directory containing .env.local
 * @returns The auth token, or null if not found
 */
function readAuthToken(outputDir: string): string | null {
  const envPath = path.join(outputDir, '.env.local');

  if (fs.existsSync(envPath)) {
    const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf-8'));
    return (
      parsed['BEEHIIV_API_KEY'] ||
      parsed['BEEHIIV_ACCESS_TOKEN'] ||
      null
    );
  }

  return (
    process.env['BEEHIIV_API_KEY'] ||
    process.env['BEEHIIV_ACCESS_TOKEN'] ||
    null
  );
}

/**
 * Run the `beehiiv-react sync` command.
 *
 * Reads the publication ID and API key from existing config files,
 * fetches the current custom field definitions from the beehiiv API,
 * and regenerates `types/beehiiv.generated.ts`. Does NOT overwrite
 * config, API routes, or server actions.
 *
 * Reports how many fields were synced and whether any changes were detected
 * by comparing the new output against the existing file content.
 *
 * @param options - Command options including the output directory
 * @throws {Error} If config or credentials are missing, or if the API call fails
 *
 * @example
 * ```ts
 * await runSync({ outputDir: '.' });
 * ```
 */
export async function runSync(options: SyncOptions): Promise<void> {
  const { default: chalk } = await import('chalk');
  const { default: ora } = await import('ora');

  const outputDir = options.outputDir ?? '.';

  console.log(chalk.cyan.bold('\nbeehiiv-react sync\n'));

  // Read config
  const publicationId = readPublicationId(outputDir);
  if (!publicationId) {
    console.log(
      chalk.red(
        'Could not find publication ID. Run `npx beehiiv-react init` first.',
      ),
    );
    throw new Error('Publication ID not found in beehiiv.config.ts');
  }

  const publicationName = readPublicationName(outputDir);

  const authToken = readAuthToken(outputDir);
  if (!authToken) {
    console.log(
      chalk.red(
        'Could not find API key or access token. Check your .env.local file.',
      ),
    );
    throw new Error(
      'Auth token not found in .env.local or environment variables.',
    );
  }

  // Fetch custom fields
  const spinner = ora('Fetching custom fields from beehiiv...').start();

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
      `Fetched ${fields.length} custom field${fields.length === 1 ? '' : 's'}.`,
    ),
  );

  // Check if the output file already exists and compare
  const outputPath = path.join(
    outputDir,
    'types',
    'beehiiv.generated.ts',
  );
  const existingContent = fs.existsSync(outputPath)
    ? fs.readFileSync(outputPath, 'utf-8')
    : null;

  // Regenerate the types file
  await generateCustomFieldTypes({
    fields,
    publicationName,
    outputDir,
  });

  // Report whether anything changed
  const newContent = fs.readFileSync(outputPath, 'utf-8');
  const changed = existingContent !== newContent;

  console.log('');
  if (changed) {
    console.log(
      chalk.green.bold(
        `Synced ${fields.length} field${fields.length === 1 ? '' : 's'} — types updated.`,
      ),
    );
  } else {
    console.log(
      chalk.gray(
        `Synced ${fields.length} field${fields.length === 1 ? '' : 's'} — no changes detected.`,
      ),
    );
  }
  console.log('');
}
