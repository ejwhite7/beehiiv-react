/**
 * Shared helpers for the CLI code generators.
 *
 * @module cli/generators/utils
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { confirmOverwrite } from '../prompts/index.js';

/**
 * Escape a value for safe embedding inside a single-quoted TypeScript
 * string literal in generated code.
 *
 * Handlebars `{{...}}` applies HTML-entity escaping, which corrupts values
 * like `"Acme & Co."` into `"Acme &amp; Co."` when the output position is a
 * TS string literal rather than HTML. Generators should pass values through
 * this helper and render them with triple-brace `{{{...}}}` instead.
 *
 * @param value - The raw string value
 * @returns The value with backslashes, single quotes, and newlines escaped
 */
export function escapeTsString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

/** Options accepted by {@link writeFileWithConfirm}. */
export interface WriteFileWithConfirmOptions {
  /** Skip the overwrite prompt and always write (used by `sync`) */
  force?: boolean;
}

/**
 * Write a generated file, prompting before overwriting an existing one.
 *
 * Creates parent directories as needed. When the target exists and `force`
 * is not set, the user is asked via {@link confirmOverwrite}; declining
 * leaves the existing file untouched.
 *
 * @param outputPath - Destination path for the generated file
 * @param content - File content to write
 * @param options - Optional `force` flag to skip the prompt
 * @returns `true` if the file was written, `false` if the user declined
 */
export async function writeFileWithConfirm(
  outputPath: string,
  content: string,
  options?: WriteFileWithConfirmOptions,
): Promise<boolean> {
  const { default: chalk } = await import('chalk');

  if (!options?.force && fs.existsSync(outputPath)) {
    const proceed = await confirmOverwrite(outputPath);
    if (!proceed) {
      console.log(chalk.yellow(`  Skipped ${outputPath}`));
      return false;
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(chalk.green(`  Created ${outputPath}`));
  return true;
}
