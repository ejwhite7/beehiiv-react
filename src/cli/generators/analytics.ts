/**
 * Analytics utility generator for the beehiiv CLI.
 * Generates the pushEvent utility for GTM dataLayer integration
 * and writes it to the user's project directory.
 * @module cli/generators/analytics
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';
import { writeFileWithConfirm } from './utils.js';

/** Data required to generate the analytics utility file */
export interface AnalyticsGeneratorData {
  /** The output directory to write the analytics file to */
  outputDir: string;
}

/**
 * Generate the analytics utility file from the Handlebars template.
 *
 * Loads the `templates/analytics.ts.hbs` template file, compiles it
 * with Handlebars, and writes the result to `{outputDir}/lib/beehiiv/analytics.ts`.
 * Creates all necessary directories automatically.
 *
 * @param data - The output directory configuration
 * @throws {Error} If the template file cannot be found or the output cannot be written
 */
export async function generateAnalytics(
  data: AnalyticsGeneratorData,
): Promise<void> {
  const templatePath = path.resolve(
    __dirname,
    '..',
    '..',
    'templates',
    'analytics.ts.hbs',
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);
  const output = template({});

  const outputPath = path.join(
    data.outputDir,
    'lib',
    'beehiiv',
    'analytics.ts',
  );
  await writeFileWithConfirm(outputPath, output);
}
