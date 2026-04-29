/**
 * Hook generator for the beehiiv CLI.
 * Generates the useSubscriberStatus hook for subscription
 * persistence tracking via cookie + localStorage.
 * @module cli/generators/hooks
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';

/** Data required to generate the hooks file */
export interface HookGeneratorData {
  /** The output directory to write the hook file to */
  outputDir: string;
}

/**
 * Generate the useSubscriberStatus hook from the Handlebars template.
 *
 * Loads the `templates/use-subscriber-status.ts.hbs` template file,
 * compiles it with Handlebars, and writes the result to
 * `{outputDir}/hooks/use-subscriber-status.ts`.
 * Creates all necessary directories automatically.
 *
 * @param data - The output directory configuration
 * @throws {Error} If the template file cannot be found or the output cannot be written
 */
export async function generateSubscriberStatusHook(
  data: HookGeneratorData,
): Promise<void> {
  const { default: chalk } = await import('chalk');

  const templatePath = path.resolve(
    __dirname,
    '..',
    '..',
    'templates',
    'use-subscriber-status.ts.hbs',
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);
  const output = template({});

  const outputPath = path.join(
    data.outputDir,
    'hooks',
    'use-subscriber-status.ts',
  );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, 'utf-8');

  console.log(chalk.green(`  Created ${outputPath}`));
}
