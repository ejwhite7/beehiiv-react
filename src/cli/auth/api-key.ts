/**
 * API key authentication for the beehiiv CLI.
 * Prompts the user for their API key and validates it.
 * @module cli/auth/api-key
 */

/**
 * Prompt the user to enter their beehiiv API key.
 * Validates the key by making a test API call.
 *
 * @returns The validated API key
 */
export async function promptForApiKey(): Promise<string> {
  // TODO: Implement interactive prompt with inquirer in Stage 2
  throw new Error('API key prompt not yet implemented.');
}
