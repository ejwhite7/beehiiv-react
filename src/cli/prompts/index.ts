/**
 * Interactive prompts for the beehiiv CLI.
 * Uses inquirer to guide users through setup decisions.
 * @module cli/prompts
 */

import type { PublicationInfo } from '../../types/publication.js';

/**
 * Prompt the user to select a publication from a list.
 *
 * @param publications - Array of publications to choose from
 * @returns The selected publication
 */
export async function selectPublication(
  publications: PublicationInfo[],
): Promise<PublicationInfo> {
  // TODO: Implement inquirer prompt in Stage 2
  void publications;
  throw new Error('Not yet implemented');
}
