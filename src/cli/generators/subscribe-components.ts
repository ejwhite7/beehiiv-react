/**
 * Subscribe component generator for the beehiiv CLI.
 * Generates the SubscribeCTA, SubscribeStepTwo, and SubscribeWrapper
 * components for the user's Next.js project.
 * @module cli/generators/subscribe-components
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';
import { writeFileWithConfirm } from './utils.js';

/** Data required to generate the subscribe component files */
export interface SubscribeComponentsGeneratorData {
  /** The output directory to write the component files to */
  outputDir: string;
  /** Use generated Server Actions for subscription mutations */
  useServerActions: boolean;
  /** Use generated API routes when Server Actions are not selected */
  useApiRoutes: boolean;
}

/**
 * Generate the subscribe component files from Handlebars templates.
 *
 * Creates the CTA and wrapper for either supported mutation transport. The
 * step-two enrichment component is generated only with Server Actions because
 * it requires the protected existing-subscriber mutation boundary.
 *
 * Possible files:
 * 1. `{outputDir}/components/beehiiv/SubscribeCTA.tsx`
 * 2. `{outputDir}/components/beehiiv/SubscribeStepTwo.tsx`
 * 3. `{outputDir}/components/beehiiv/SubscribeWrapper.tsx`
 *
 * @param data - The output directory configuration
 * @throws {Error} If template files cannot be found or outputs cannot be written
 */
export async function generateSubscribeComponents(
  data: SubscribeComponentsGeneratorData,
): Promise<void> {
  if (!data.useServerActions && !data.useApiRoutes) return;

  const templates = [
    {
      template: 'subscribe-cta.tsx.hbs',
      output: path.join(
        data.outputDir,
        'components',
        'beehiiv',
        'SubscribeCTA.tsx',
      ),
    },
    ...(data.useServerActions
      ? [
          {
            template: 'subscribe-step-two.tsx.hbs',
            output: path.join(
              data.outputDir,
              'components',
              'beehiiv',
              'SubscribeStepTwo.tsx',
            ),
          },
        ]
      : []),
    {
      template: 'subscribe-wrapper.tsx.hbs',
      output: path.join(
        data.outputDir,
        'components',
        'beehiiv',
        'SubscribeWrapper.tsx',
      ),
    },
  ];

  for (const { template: templateFile, output: outputPath } of templates) {
    const templatePath = path.resolve(
      __dirname,
      '..',
      '..',
      'templates',
      templateFile,
    );

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);
    const output = template({
      useServerActions: data.useServerActions,
      useApiRoutes: data.useApiRoutes,
    });

    await writeFileWithConfirm(outputPath, output);
  }
}
