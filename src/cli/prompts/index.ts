/**
 * Interactive prompts for the beehiiv CLI.
 * Uses inquirer to guide users through setup decisions including
 * publication selection, feature selection, and file overwrite confirmation.
 * @module cli/prompts
 */

import type { PublicationInfo } from '../../types/publication.js';

/**
 * Result of the feature selection prompt.
 */
export interface FeatureSelection {
  /** Whether to generate Next.js App Router API routes */
  apiRoutes: boolean;
  /** Whether to generate Next.js Server Actions */
  serverActions: boolean;
}

/**
 * Prompt the user to select a publication from a list.
 *
 * Displays an interactive list prompt showing each publication's name
 * and ID. The user selects one publication to configure for their project.
 *
 * @param publications - Array of publications to choose from
 * @returns The selected publication
 * @throws {Error} If no publications are available
 *
 * @example
 * ```ts
 * const pub = await selectPublication(publications);
 * console.log(`Selected: ${pub.name} (${pub.id})`);
 * ```
 */
export async function selectPublication(
  publications: PublicationInfo[],
): Promise<PublicationInfo> {
  const { default: inquirer } = await import('inquirer');

  if (publications.length === 0) {
    throw new Error('No publications found for this API key.');
  }

  if (publications.length === 1) {
    const { default: chalk } = await import('chalk');
    console.log(
      chalk.cyan(`Auto-selecting publication: ${publications[0].name}`),
    );
    return publications[0];
  }

  const { publicationId } = await inquirer.prompt<{
    publicationId: string;
  }>([
    {
      type: 'list',
      name: 'publicationId',
      message: 'Select a publication:',
      choices: publications.map((pub) => ({
        name: `${pub.name} (${pub.id})`,
        value: pub.id,
      })),
    },
  ]);

  const selected = publications.find((pub) => pub.id === publicationId);
  if (!selected) {
    throw new Error('Selected publication not found.');
  }

  return selected;
}

/**
 * Prompt the user to select which features to generate.
 *
 * Displays a checkbox prompt with options for generating Next.js
 * API routes and server actions. The user can select one, both, or neither.
 *
 * @returns An object indicating which features were selected
 *
 * @example
 * ```ts
 * const features = await selectFeatures();
 * if (features.apiRoutes) console.log('Generating API routes...');
 * ```
 */
export async function selectFeatures(): Promise<FeatureSelection> {
  const { default: inquirer } = await import('inquirer');

  const { features } = await inquirer.prompt<{ features: string[] }>([
    {
      type: 'checkbox',
      name: 'features',
      message: 'Which features would you like to generate?',
      choices: [
        {
          name: 'Next.js API routes (App Router)',
          value: 'apiRoutes',
          checked: true,
        },
        {
          name: 'Next.js Server Actions',
          value: 'serverActions',
          checked: true,
        },
      ],
    },
  ]);

  return {
    apiRoutes: features.includes('apiRoutes'),
    serverActions: features.includes('serverActions'),
  };
}

/**
 * Prompt the user to confirm overwriting an existing file.
 *
 * Displays a confirmation prompt warning that a file at the given path
 * already exists and asking if it should be overwritten.
 *
 * @param path - The file path that would be overwritten
 * @returns `true` if the user confirms overwriting, `false` otherwise
 *
 * @example
 * ```ts
 * if (await confirmOverwrite('./beehiiv.config.ts')) {
 *   // proceed with overwrite
 * }
 * ```
 */
export async function confirmOverwrite(path: string): Promise<boolean> {
  const { default: inquirer } = await import('inquirer');
  const { default: chalk } = await import('chalk');

  const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
    {
      type: 'confirm',
      name: 'overwrite',
      message: `${chalk.yellow(path)} already exists. Overwrite?`,
      default: false,
    },
  ]);

  return overwrite;
}
