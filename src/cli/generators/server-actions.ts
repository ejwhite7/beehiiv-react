/**
 * Server action generator for the beehiiv CLI.
 * Generates Next.js Server Actions for subscription management
 * and writes them to the user's project directory.
 * @module cli/generators/server-actions
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';

/** Data required to generate the server actions file */
export interface ServerActionGeneratorData {
  /** The output directory to write the actions file to */
  outputDir: string;
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
 * await generateServerActions({ outputDir: '.' });
 * ```
 */
export async function generateServerActions(
  data: ServerActionGeneratorData,
): Promise<void> {
  const { default: chalk } = await import('chalk');

  const templatePath = path.resolve(
    __dirname,
    '..',
    '..',
    'templates',
    'server-action.ts.hbs',
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);
  const output = template({});

  const outputPath = path.join(
    data.outputDir,
    'lib',
    'beehiiv',
    'actions.ts',
  );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, 'utf-8');

  console.log(chalk.green(`  Created ${outputPath}`));
}
