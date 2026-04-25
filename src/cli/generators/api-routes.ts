/**
 * API route generator for the beehiiv CLI.
 * Generates Next.js App Router API routes for subscription management.
 * @module cli/generators/api-routes
 */

/** Data required to generate the API route */
export interface ApiRouteGeneratorData {
  /** The publication ID */
  publicationId: string;
  /** The publication name */
  publicationName: string;
}

/**
 * Generate the Next.js API route file from the Handlebars template.
 *
 * @param data - Publication data to inject into the template
 * @returns The rendered TypeScript API route file content
 */
export async function generateApiRoutes(data: ApiRouteGeneratorData): Promise<string> {
  // TODO: Implement Handlebars rendering in Stage 2
  void data;
  throw new Error('Not yet implemented');
}
