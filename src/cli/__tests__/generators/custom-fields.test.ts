/**
 * Snapshot tests for the custom field types generator.
 * Verifies that the generated TypeScript output matches expected format
 * for all field kinds including list fields with options.
 * @module cli/__tests__/generators/custom-fields
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { CustomFieldInfo } from '../../../types/custom-field.js';
import { generateCustomFieldTypes } from '../../generators/custom-fields.js';

/** Mock custom fields covering all field kinds */
const mockFields: CustomFieldInfo[] = [
  {
    id: 'cf_001',
    kind: 'string',
    display: 'First Name',
    created: 1700000000,
  },
  {
    id: 'cf_002',
    kind: 'integer',
    display: 'Age',
    created: 1700000001,
  },
  {
    id: 'cf_003',
    kind: 'double',
    display: 'Account Balance',
    created: 1700000002,
  },
  {
    id: 'cf_004',
    kind: 'boolean',
    display: 'Is Premium',
    created: 1700000003,
  },
  {
    id: 'cf_005',
    kind: 'date',
    display: 'Birth Date',
    created: 1700000004,
  },
  {
    id: 'cf_006',
    kind: 'datetime',
    display: 'Last Login',
    created: 1700000005,
  },
  {
    id: 'cf_007',
    kind: 'list',
    display: 'Favorite Color',
    created: 1700000006,
    options: ['red', 'green', 'blue'],
  },
  {
    id: 'cf_008',
    kind: 'list',
    display: 'Plan Type',
    created: 1700000007,
  },
];

describe('generateCustomFieldTypes', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'beehiiv-custom-fields-test-'),
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should generate types for all field kinds matching the snapshot', async () => {
    await generateCustomFieldTypes({
      fields: mockFields,
      publicationName: 'Test Newsletter',
      outputDir: tmpDir,
    });

    const outputPath = path.join(
      tmpDir,
      'types',
      'beehiiv.generated.ts',
    );
    expect(fs.existsSync(outputPath)).toBe(true);

    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toMatchSnapshot();
  });

  it('should create the types directory', async () => {
    await generateCustomFieldTypes({
      fields: mockFields,
      publicationName: 'Test Newsletter',
      outputDir: tmpDir,
    });

    expect(
      fs.existsSync(path.join(tmpDir, 'types')),
    ).toBe(true);
  });

  it('should map string fields to string type', async () => {
    await generateCustomFieldTypes({
      fields: [mockFields[0]],
      publicationName: 'Test',
      outputDir: tmpDir,
    });

    const content = fs.readFileSync(
      path.join(tmpDir, 'types', 'beehiiv.generated.ts'),
      'utf-8',
    );
    expect(content).toContain('firstName?: string');
  });

  it('should map integer fields to number type', async () => {
    await generateCustomFieldTypes({
      fields: [mockFields[1]],
      publicationName: 'Test',
      outputDir: tmpDir,
    });

    const content = fs.readFileSync(
      path.join(tmpDir, 'types', 'beehiiv.generated.ts'),
      'utf-8',
    );
    expect(content).toContain('age?: number');
  });

  it('should map boolean fields to boolean type', async () => {
    await generateCustomFieldTypes({
      fields: [mockFields[3]],
      publicationName: 'Test',
      outputDir: tmpDir,
    });

    const content = fs.readFileSync(
      path.join(tmpDir, 'types', 'beehiiv.generated.ts'),
      'utf-8',
    );
    expect(content).toContain('isPremium?: boolean');
  });

  it('should map list fields with options to literal union type', async () => {
    await generateCustomFieldTypes({
      fields: [mockFields[6]],
      publicationName: 'Test',
      outputDir: tmpDir,
    });

    const content = fs.readFileSync(
      path.join(tmpDir, 'types', 'beehiiv.generated.ts'),
      'utf-8',
    );
    expect(content).toContain("'red' | 'green' | 'blue'");
  });

  it('should map list fields without options to string', async () => {
    await generateCustomFieldTypes({
      fields: [mockFields[7]],
      publicationName: 'Test',
      outputDir: tmpDir,
    });

    const content = fs.readFileSync(
      path.join(tmpDir, 'types', 'beehiiv.generated.ts'),
      'utf-8',
    );
    expect(content).toContain('planType?: string');
  });

  it('should include publication name in the header comment', async () => {
    await generateCustomFieldTypes({
      fields: mockFields,
      publicationName: 'My Awesome Newsletter',
      outputDir: tmpDir,
    });

    const content = fs.readFileSync(
      path.join(tmpDir, 'types', 'beehiiv.generated.ts'),
      'utf-8',
    );
    expect(content).toContain('My Awesome Newsletter');
  });

  it('should handle empty fields array', async () => {
    await generateCustomFieldTypes({
      fields: [],
      publicationName: 'Empty Newsletter',
      outputDir: tmpDir,
    });

    const outputPath = path.join(
      tmpDir,
      'types',
      'beehiiv.generated.ts',
    );
    expect(fs.existsSync(outputPath)).toBe(true);

    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toMatchSnapshot();
  });
});
