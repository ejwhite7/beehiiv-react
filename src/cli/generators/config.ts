/**
 * Config file generator for the beehiiv CLI.
 * Renders the beehiiv.config.ts Handlebars template with publication data
 * and writes it to the user's project directory.
 * @module cli/generators/config
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';

/** Data required to generate the config file */
export interface ConfigGeneratorData {
  /** The publication ID */
  publicationId: string;
  /** The publication name */
  publicationName: string;
  /** The output directory to write the config file to */
  outputDir: string;
}

/**
 * Generate the beehiiv.config.ts file from the Handlebars template.
 *
 * Loads the `templates/config.ts.hbs` template file, compiles it with
 * Handlebars using the provided publication data, and writes the result
 * to `{outputDir}/beehiiv.config.ts`.
 *
 * @param data - Publication data and output directory configuration
 * @throws {Error} If the template file cannot be found or the output cannot be written
 *
 * @example
 * ```ts
 * await generateConfig({
 *   publicationId: 'pub_abc123',
 *   publicationName: 'My Newsletter',
 *   outputDir: '.',
 * });
 * ```
 */
export async function generateConfig(data: ConfigGeneratorData): Promise<void> {
  const { default: chalk } = await import('chalk');

  const templatePath = path.resolve(
    __dirname,
    '..',
    '..',
    'templates',
    'config.ts.hbs',
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);

  const output = template({
    publicationId: data.publicationId,
    publicationName: data.publicationName,
  });

  const outputPath = path.join(data.outputDir, 'beehiiv.config.ts');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, 'utf-8');

  console.log(chalk.green(`  Created ${outputPath}`));
}
