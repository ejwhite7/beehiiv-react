/**
 * API key authentication for the beehiiv CLI.
 * Prompts the user for their beehiiv API key using an interactive
 * password-masked input, validates the key against the beehiiv API,
 * and returns the validated key along with the user's publications.
 * @module cli/auth/api-key
 */

import type { PublicationInfo } from '../../types/publication.js';

/** Maximum number of times the user can retry entering an API key */
const MAX_ATTEMPTS = 3;

/** beehiiv API v2 base URL used for key validation */
const BEEHIIV_API_BASE = 'https://api.beehiiv.com/v2';

/**
 * Result of a successful API key authentication.
 */
export interface ApiKeyAuthResult {
  /** The validated beehiiv API key */
  apiKey: string;
  /** List of publications accessible with this key */
  publications: PublicationInfo[];
}

/**
 * Prompt the user to enter their beehiiv API key and validate it.
 *
 * Uses `inquirer` with a password-type input (masked) to collect the key,
 * then validates it by calling `GET /v2/publications` with the key as a
 * Bearer token. On 401/403 errors, the user is re-prompted up to 3 total
 * attempts. An `ora` spinner is shown during validation.
 *
 * @returns The validated API key and the list of accessible publications
 * @throws {Error} If the user fails to provide a valid key after 3 attempts
 *
 * @example
 * ```ts
 * const { apiKey, publications } = await promptForApiKey();
 * console.log(`Authenticated! Found ${publications.length} publications.`);
 * ```
 */
export async function promptForApiKey(): Promise<ApiKeyAuthResult> {
  const { default: inquirer } = await import('inquirer');
  const { default: chalk } = await import('chalk');
  const { default: ora } = await import('ora');

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { apiKey } = await inquirer.prompt<{ apiKey: string }>([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your beehiiv API key:',
        mask: '*',
        validate: (input: string) =>
          input.trim().length > 0 || 'API key cannot be empty.',
      },
    ]);

    const trimmedKey = apiKey.trim();
    const spinner = ora('Validating API key...').start();

    try {
      const response = await fetch(`${BEEHIIV_API_BASE}/publications`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${trimmedKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        spinner.fail(chalk.red('Invalid API key.'));

        if (attempt < MAX_ATTEMPTS) {
          console.log(
            chalk.yellow(
              `Please try again (attempt ${attempt + 1} of ${MAX_ATTEMPTS}).`,
            ),
          );
        }
        continue;
      }

      if (!response.ok) {
        spinner.fail(
          chalk.red(`API returned status ${response.status}.`),
        );
        throw new Error(
          `beehiiv API returned unexpected status: ${response.status}`,
        );
      }

      const body = (await response.json()) as { data: PublicationInfo[] };
      const publications = body.data;

      spinner.succeed(
        chalk.green(
          `API key validated! Found ${publications.length} publication${publications.length === 1 ? '' : 's'}.`,
        ),
      );

      return { apiKey: trimmedKey, publications };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.startsWith('beehiiv API returned')
      ) {
        throw error;
      }

      spinner.fail(chalk.red('Failed to connect to beehiiv API.'));

      if (attempt < MAX_ATTEMPTS) {
        console.log(
          chalk.yellow(
            `Please check your network and try again (attempt ${attempt + 1} of ${MAX_ATTEMPTS}).`,
          ),
        );
        continue;
      }

      throw new Error(
        `Failed to validate API key after ${MAX_ATTEMPTS} attempts: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  throw new Error(
    `Failed to validate API key after ${MAX_ATTEMPTS} attempts.`,
  );
}
