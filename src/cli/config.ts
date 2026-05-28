/**
 * Shared helpers for reading values out of a generated `beehiiv.config.ts`.
 *
 * Both the `sync` and `add blog` commands need to recover the publication
 * ID/name from a config file written by `init`. Keeping the parsing in one
 * place means a change to how `init` emits the config only has to be mirrored
 * once.
 *
 * @module cli/config
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/** Values recovered from a `beehiiv.config.ts` file. */
export interface BeehiivConfigValues {
  /** The publication ID, or `null` if absent. */
  publicationId: string | null;
  /** The publication name, or `null` if absent. */
  publicationName: string | null;
}

/**
 * Read `publicationId` / `publicationName` from `beehiiv.config.ts`.
 *
 * Reads the file once and applies a lightweight regex for each field so we
 * don't have to pull in a TypeScript loader. Returns `null` values for any
 * field that can't be found (and for a missing file).
 *
 * @param outputDir - The directory containing `beehiiv.config.ts`
 */
export function readBeehiivConfig(outputDir: string): BeehiivConfigValues {
  const configPath = path.join(outputDir, 'beehiiv.config.ts');
  if (!fs.existsSync(configPath)) {
    return { publicationId: null, publicationName: null };
  }
  const content = fs.readFileSync(configPath, 'utf-8');
  const idMatch = content.match(/publicationId:\s*['"]([^'"]+)['"]/);
  const nameMatch = content.match(/publicationName:\s*['"]([^'"]+)['"]/);
  return {
    publicationId: idMatch ? idMatch[1] : null,
    publicationName: nameMatch ? nameMatch[1] : null,
  };
}
