/**
 * Snapshot tests for the config file generator.
 * Verifies that the generated beehiiv.config.ts output matches expected format.
 * @module cli/__tests__/generators/config
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { generateConfig } from '../../generators/config.js';

describe('generateConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'beehiiv-config-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should generate a config file matching the snapshot', async () => {
    await generateConfig({
      publicationId: 'pub_test123',
      publicationName: 'Test Newsletter',
      outputDir: tmpDir,
    });

    const outputPath = path.join(tmpDir, 'beehiiv.config.ts');
    expect(fs.existsSync(outputPath)).toBe(true);

    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toMatchSnapshot();
  });

  it('should include the correct publication ID', async () => {
    await generateConfig({
      publicationId: 'pub_abc456',
      publicationName: 'My Newsletter',
      outputDir: tmpDir,
    });

    const content = fs.readFileSync(
      path.join(tmpDir, 'beehiiv.config.ts'),
      'utf-8',
    );
    expect(content).toContain("'pub_abc456'");
  });

  it('should include the correct publication name', async () => {
    await generateConfig({
      publicationId: 'pub_abc456',
      publicationName: 'My Special Newsletter',
      outputDir: tmpDir,
    });

    const content = fs.readFileSync(
      path.join(tmpDir, 'beehiiv.config.ts'),
      'utf-8',
    );
    expect(content).toContain('My Special Newsletter');
  });
});
