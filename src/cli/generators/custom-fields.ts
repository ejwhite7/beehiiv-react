/**
 * Custom field type generator for the beehiiv CLI.
 * Renders strongly-typed custom field definitions from API data using
 * Handlebars templates and writes the generated TypeScript file to the
 * user's project directory.
 * @module cli/generators/custom-fields
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';
import type { CustomFieldInfo, CustomFieldKind } from '../../types/custom-field.js';

/** Data required to generate the custom field types file */
export interface CustomFieldGeneratorData {
  /** Array of custom field definitions from the API */
  fields: CustomFieldInfo[];
  /** The publication name for comments in the generated file */
  publicationName: string;
  /** The output directory to write the types file to */
  outputDir: string;
}

/** Extended field data with computed TypeScript type and camelCase name */
interface FieldTemplateData {
  /** Unique field ID */
  id: string;
  /** Display name of the field */
  display: string;
  /** beehiiv field kind */
  kind: CustomFieldKind;
  /** Computed TypeScript type string */
  tsType: string;
  /** Display name converted to camelCase */
  camelCaseDisplay: string;
  /** Field key in camelCase for template usage */
  camelCaseKey: string;
  /** Available options for list-type fields */
  options?: string[];
}

/**
 * Convert a display name string to camelCase.
 *
 * Splits on non-alphanumeric characters, lowercases the first word,
 * and capitalizes subsequent words.
 *
 * @param str - The display name to convert
 * @returns The camelCase version of the string
 *
 * @example
 * ```ts
 * toCamelCase('First Name') // => 'firstName'
 * toCamelCase('UTM Source') // => 'utmSource'
 * ```
 */
function toCamelCase(str: string): string {
  const words = str.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (words.length === 0) return '';

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

/**
 * Map a beehiiv custom field kind to its corresponding TypeScript type string.
 *
 * @param kind - The beehiiv field kind
 * @param options - Available options for list-type fields
 * @returns The TypeScript type representation
 */
function mapKindToTsType(kind: CustomFieldKind, options?: string[]): string {
  switch (kind) {
    case 'string':
      return 'string';
    case 'integer':
      return 'number';
    case 'double':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'string';
    case 'datetime':
      return 'string';
    case 'list':
      if (options && options.length > 0) {
        return options.map((opt) => `'${opt}'`).join(' | ');
      }
      return 'string';
    default:
      return 'string';
  }
}

/**
 * Generate the custom fields TypeScript file from API data.
 *
 * Maps each `CustomFieldInfo` to template data with computed TypeScript types
 * and camelCase display names. Registers a Handlebars `camelCase` helper,
 * loads the `templates/custom-fields.ts.hbs` template, and writes the compiled
 * output to `{outputDir}/lib/beehiiv/beehiiv-custom-fields.ts` so that the
 * server action template can import it with a relative `./beehiiv-custom-fields`
 * path.
 *
 * Type mapping:
 * - `string` -> `string`
 * - `integer` -> `number`
 * - `double` -> `number`
 * - `boolean` -> `boolean`
 * - `date` -> `string`
 * - `datetime` -> `string`
 * - `list` -> `'opt1' | 'opt2' | ...` (literal union from options, fallback to `string`)
 *
 * @param data - The custom field definitions, publication name, and output directory
 * @throws {Error} If the template file cannot be found or the output cannot be written
 *
 * @example
 * ```ts
 * await generateCustomFieldTypes({
 *   fields: [{ id: 'cf_1', kind: 'string', display: 'First Name', created: 123 }],
 *   publicationName: 'My Newsletter',
 *   outputDir: '.',
 * });
 * ```
 */
export async function generateCustomFieldTypes(
  data: CustomFieldGeneratorData,
): Promise<void> {
  const { default: chalk } = await import('chalk');

  const handlebarsInstance = Handlebars.create();

  handlebarsInstance.registerHelper('camelCase', (str: string) => {
    return toCamelCase(str);
  });

  const fieldsData: FieldTemplateData[] = data.fields.map((field) => ({
    id: field.id,
    display: field.display,
    kind: field.kind,
    tsType: mapKindToTsType(field.kind, field.options),
    camelCaseDisplay: toCamelCase(field.display),
    camelCaseKey: toCamelCase(field.display),
    options: field.options,
  }));

  const templatePath = path.resolve(
    __dirname,
    '..',
    '..',
    'templates',
    'custom-fields.ts.hbs',
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = handlebarsInstance.compile(templateSource);

  const output = template({
    publicationName: data.publicationName,
    generatedAt: new Date().toISOString(),
    fields: fieldsData,
  });

  const outputPath = path.join(
    data.outputDir,
    'lib',
    'beehiiv',
    'beehiiv-custom-fields.ts',
  );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, 'utf-8');

  console.log(chalk.green(`  Created ${outputPath}`));
}
