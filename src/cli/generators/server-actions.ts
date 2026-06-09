/**
 * Server action generator for the beehiiv CLI.
 * Generates Next.js Server Actions for subscription management
 * and writes them to the user's project directory.
 * @module cli/generators/server-actions
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';
import { writeFileWithConfirm } from './utils.js';

/** Data required to generate the server actions file */
export interface ServerActionGeneratorData {
  /** The output directory to write the actions file to */
  outputDir: string;
  /** The beehiiv publication ID baked into the generated client fallback */
  publicationId: string;
}

/**
 * Generate the Next.js Server Action file from the Handlebars template.
 *
 * Loads the `templates/server-action.ts.hbs` template file, compiles it
 * with Handlebars, and writes the result to `{outputDir}/lib/beehiiv/actions.ts`.
 * Creates all necessary directories automatically.
 *
 * @param data - The output directory configuration
 * @throws {Error} If the template file cannot be found or the output cannot be written
 *
 * @example
 * ```ts
 * await generateServerActions({ outputDir: '.', publicationId: 'pub_abc' });
 * ```
 */
export async function generateServerActions(
  data: ServerActionGeneratorData,
): Promise<void> {
  const templatePath = path.resolve(
    __dirname,
    '..',
    '..',
    'templates',
    'server-action.ts.hbs',
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);
  const output = template({ publicationId: data.publicationId });

  const outputPath = path.join(
    data.outputDir,
    'lib',
    'beehiiv',
    'actions.ts',
  );
  await writeFileWithConfirm(outputPath, output);
}
