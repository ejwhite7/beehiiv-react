/**
 * Non-interactive scaffold orchestration shared by the CLI and CI fixtures.
 * @module cli/scaffold
 */

import * as path from 'node:path';
import type { CustomFieldInfo } from '../types/custom-field.js';
import type { FeatureSelection } from './prompts/index.js';
import { generateAnalytics } from './generators/analytics.js';
import { generateApiRoutes } from './generators/api-routes.js';
import { generateConfig } from './generators/config.js';
import { generateCustomFieldTypes } from './generators/custom-fields.js';
import { generateSubscriberStatusHook } from './generators/hooks.js';
import { generateServerActions } from './generators/server-actions.js';
import { generateSubscribeComponents } from './generators/subscribe-components.js';

/** Inputs required to generate the non-interactive integration scaffold. */
export interface ScaffoldIntegrationOptions {
  outputDir: string;
  publicationId: string;
  publicationName: string;
  customFields: CustomFieldInfo[];
  features: FeatureSelection;
}

/**
 * Generate all core integration files for a selected feature combination.
 *
 * Keeping this orchestration independent from authentication and prompts lets
 * CI exercise the exact production generator path in real Next.js fixtures.
 */
export async function scaffoldIntegration(
  options: ScaffoldIntegrationOptions,
): Promise<string[]> {
  const { outputDir, publicationId, publicationName, customFields, features } =
    options;
  const generatedFiles: string[] = [];

  await generateConfig({ publicationId, publicationName, outputDir });
  generatedFiles.push(path.join(outputDir, 'beehiiv.config.ts'));

  await generateCustomFieldTypes({
    fields: customFields,
    publicationName,
    outputDir,
  });
  generatedFiles.push(
    path.join(outputDir, 'lib', 'beehiiv', 'beehiiv-custom-fields.ts'),
  );

  if (features.apiRoutes) {
    await generateApiRoutes({ outputDir, publicationId });
    generatedFiles.push(
      path.join(outputDir, 'app', 'api', 'beehiiv', 'subscribe', 'route.ts'),
      path.join(
        outputDir,
        'app',
        'api',
        'beehiiv',
        'subscription',
        '[id]',
        'route.ts',
      ),
      path.join(outputDir, 'app', 'api', 'beehiiv', 'posts', 'route.ts'),
    );
  }

  if (features.serverActions) {
    await generateServerActions({ outputDir, publicationId });
    generatedFiles.push(path.join(outputDir, 'lib', 'beehiiv', 'actions.ts'));
  }

  await generateSubscriberStatusHook({ outputDir });
  generatedFiles.push(
    path.join(outputDir, 'hooks', 'use-subscriber-status.ts'),
  );

  await generateAnalytics({ outputDir });
  generatedFiles.push(path.join(outputDir, 'lib', 'beehiiv', 'analytics.ts'));

  if (features.apiRoutes || features.serverActions) {
    await generateSubscribeComponents({
      outputDir,
      useServerActions: features.serverActions,
      useApiRoutes: features.apiRoutes,
    });
    generatedFiles.push(
      path.join(outputDir, 'components', 'beehiiv', 'SubscribeCTA.tsx'),
    );
    if (features.serverActions) {
      generatedFiles.push(
        path.join(outputDir, 'components', 'beehiiv', 'SubscribeStepTwo.tsx'),
      );
    }
    generatedFiles.push(
      path.join(outputDir, 'components', 'beehiiv', 'SubscribeWrapper.tsx'),
    );
  }

  return generatedFiles;
}
