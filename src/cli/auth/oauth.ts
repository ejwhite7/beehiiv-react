/**
 * OAuth2 authentication flow for the beehiiv CLI.
 * Opens a browser window for the user to authorize the app.
 * @module cli/auth/oauth
 */

/** OAuth2 token response */
export interface OAuthTokenResponse {
  /** The access token for API requests */
  accessToken: string;
  /** The refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Token expiry time in seconds */
  expiresIn: number;
}

/**
 * Run the OAuth2 authorization flow.
 * Opens the user's browser to beehiiv's authorization page
 * and starts a local server to receive the callback.
 *
 * @returns The OAuth2 token response
 */
export async function runOAuthFlow(): Promise<OAuthTokenResponse> {
  // TODO: Implement OAuth2 PKCE flow in Stage 2
  throw new Error('OAuth flow not yet implemented. Use --api-key flag instead.');
}
