/**
 * Tests for the CLI program entry point.
 * Verifies the version flag is correctly wired up and outputs
 * the expected version string from package.json.
 * @module cli/index.test
 */

import { describe, it, expect } from 'vitest';
import { createProgram } from './program.js';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg: { version: string } = require('../../package.json');

describe('CLI program', () => {
  it('should have a -v / --version option defined', () => {
    const program = createProgram();
    const versionOption = program.options.find(
      (opt) => opt.short === '-v' || opt.long === '--version',
    );
    expect(versionOption).toBeDefined();
    expect(versionOption!.short).toBe('-v');
    expect(versionOption!.long).toBe('--version');
  });

  it('should set the version string to beehiiv-react/<pkg.version>', () => {
    const program = createProgram();
    const expectedVersion = `beehiiv-react/${pkg.version}`;
    expect(program.version()).toBe(expectedVersion);
  });
});
