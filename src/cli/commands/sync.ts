/**
 * The `sync` command for beehiiv-react CLI.
 * Re-fetches custom field definitions and regenerates type files.
 * @module cli/commands/sync
 */

/** Options for the sync command */
export interface SyncOptions {
  /** API key provided via CLI flag */
  apiKey?: string;
}

/**
 * Run the `beehiiv-react sync` command.
 * Fetches the latest custom field definitions from beehiiv
 * and regenerates the TypeScript type file.
 *
 * @param options - Command options
 */
export async function runSync(options: SyncOptions): Promise<void> {
  // TODO: Implement sync logic in Stage 2
  void options;
  console.log('beehiiv-react sync -- Coming soon');
}
