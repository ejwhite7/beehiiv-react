/**
 * beehiiv-react CLI entry point.
 * Provides `init` and `sync` commands for scaffolding and maintaining
 * beehiiv integration in Next.js projects. Uses Commander.js for
 * argument parsing and command routing.
 * @module cli
 */

import { createProgram } from './program.js';

const program = createProgram();
program.parse();
