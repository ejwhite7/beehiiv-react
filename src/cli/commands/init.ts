/**
 * The `init` command for beehiiv-react CLI.
 * Scaffolds configuration, types, and API routes in the user's project.
 * @module cli/commands/init
 */

/** Options for the init command */
export interface InitOptions {
  /** Whether to use OAuth2 instead of API key auth */
  oauth?: boolean;
  /** API key provided via CLI flag */
  apiKey?: string;
}

/**
 * Run the `beehiiv-react init` command.
 * Guides the user through setup and generates project files.
 *
 * @param options - Command options
 */
export async function runInit(options: InitOptions): Promise<void> {
  // TODO: Implement full init flow in Stage 2
  void options;
  console.log('beehiiv-react init -- Coming soon');
}
