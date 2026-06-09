/**
 * OAuth2 PKCE authorization code flow for the beehiiv CLI.
 * Opens the user's browser to authorize the application, starts a local
 * HTTP callback server to receive the authorization code, and exchanges
 * it for access and refresh tokens.
 * @module cli/auth/oauth
 */

import * as http from 'node:http';
import * as crypto from 'node:crypto';
import * as url from 'node:url';

/** OAuth2 token response returned after a successful flow */
export interface OAuthTokenResponse {
  /** The access token for API requests */
  accessToken: string;
  /** The refresh token for obtaining new access tokens */
  refreshToken?: string;
  /** Token expiry time in seconds */
  expiresIn?: number;
}

/** beehiiv OAuth2 authorization endpoint */
const AUTHORIZE_URL = 'https://app.beehiiv.com/oauth/authorize';

/** beehiiv OAuth2 token exchange endpoint */
const TOKEN_URL = 'https://app.beehiiv.com/oauth/token';

/** OAuth2 scopes requested by the CLI */
const SCOPES =
  'publications:read custom_fields:read subscriptions:read subscriptions:write';

/** Timeout in milliseconds for the OAuth flow (2 minutes) */
const OAUTH_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Generate a cryptographically random string suitable for use as a
 * PKCE code_verifier or OAuth state parameter.
 *
 * @param length - The byte length of random data (default 32)
 * @returns A base64url-encoded random string
 */
function generateRandomString(length = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Compute the PKCE code_challenge from a code_verifier using SHA-256.
 *
 * @param verifier - The code_verifier string
 * @returns The base64url-encoded SHA-256 hash of the verifier
 */
function computeCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

/**
 * Run the OAuth2 PKCE authorization code flow for beehiiv.
 *
 * This function:
 * 1. Generates PKCE code_verifier and code_challenge (SHA-256, base64url)
 * 2. Starts a local HTTP server on a random available port
 * 3. Opens the user's browser to beehiiv's OAuth authorization page
 * 4. Waits for the callback with the authorization code
 * 5. Exchanges the code for tokens via POST to the token endpoint
 * 6. Closes the local server and returns the tokens
 *
 * The flow times out after 2 minutes if no callback is received.
 *
 * @param clientId - The OAuth2 client ID for the beehiiv application
 * @returns The OAuth2 token response containing access token and optional refresh token
 * @throws {Error} If the flow times out, the user denies authorization, or token exchange fails
 *
 * @example
 * ```ts
 * const tokens = await runOAuthFlow('my-client-id');
 * console.log(`Access token: ${tokens.accessToken}`);
 * ```
 */
export async function runOAuthFlow(
  clientId: string,
): Promise<OAuthTokenResponse> {
  const { default: chalk } = await import('chalk');
  const { default: ora } = await import('ora');
  const openModule = await import('open');
  const openBrowser = openModule.default;

  const codeVerifier = generateRandomString();
  const codeChallenge = computeCodeChallenge(codeVerifier);
  const state = generateRandomString(16);

  return new Promise<OAuthTokenResponse>((resolve, reject) => {
    // eslint-disable-next-line prefer-const
    let timeoutHandle: ReturnType<typeof setTimeout>;

    // Assigned in the 'listening' callback, before any request can arrive.
    // The server binds port 0 directly so the OS-assigned port is held from
    // the moment it is known — no find-then-rebind race.
    let redirectUri = '';

    const server = http.createServer(
      (req: http.IncomingMessage, res: http.ServerResponse) => {
        if (!req.url?.startsWith('/callback')) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
          return;
        }

        const parsedUrl = url.parse(req.url, true);
        const receivedState = parsedUrl.query['state'] as string | undefined;
        const code = parsedUrl.query['code'] as string | undefined;
        const error = parsedUrl.query['error'] as string | undefined;

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(
            '<html><body><h1>Authorization Failed</h1><p>You can close this window.</p></body></html>',
          );
          clearTimeout(timeoutHandle);
          server.close();
          reject(
            new Error(`OAuth authorization denied: ${error}`),
          );
          return;
        }

        if (receivedState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(
            '<html><body><h1>Invalid State</h1><p>State mismatch. Please try again.</p></body></html>',
          );
          clearTimeout(timeoutHandle);
          server.close();
          reject(new Error('OAuth state mismatch — possible CSRF attack.'));
          return;
        }

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(
            '<html><body><h1>Missing Code</h1><p>No authorization code received.</p></body></html>',
          );
          clearTimeout(timeoutHandle);
          server.close();
          reject(new Error('No authorization code received in callback.'));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(
          '<html><body><h1>Authorization Successful!</h1><p>You can close this window and return to the terminal.</p></body></html>',
        );

        clearTimeout(timeoutHandle);

        const exchangeSpinner = ora('Exchanging authorization code for tokens...').start();

        const tokenBody = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          code_verifier: codeVerifier,
        });

        fetch(TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: tokenBody.toString(),
        })
          .then(async (tokenResponse) => {
            if (!tokenResponse.ok) {
              const errorBody = await tokenResponse.text();
              exchangeSpinner.fail(
                chalk.red('Token exchange failed.'),
              );
              throw new Error(
                `Token exchange failed (${tokenResponse.status}): ${errorBody}`,
              );
            }

            const tokenData = (await tokenResponse.json()) as {
              access_token: string;
              refresh_token?: string;
              expires_in?: number;
            };

            exchangeSpinner.succeed(
              chalk.green('Successfully obtained access token!'),
            );

            server.close();
            resolve({
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              expiresIn: tokenData.expires_in,
            });
          })
          .catch((err: unknown) => {
            exchangeSpinner.fail(chalk.red('Token exchange failed.'));
            server.close();
            reject(
              err instanceof Error
                ? err
                : new Error(String(err)),
            );
          });
      },
    );

    server.on('error', (err: Error) => {
      clearTimeout(timeoutHandle);
      server.close();
      reject(
        new Error(`Could not start the OAuth callback server: ${err.message}`),
      );
    });

    server.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        clearTimeout(timeoutHandle);
        server.close();
        reject(new Error('Could not determine the OAuth callback port.'));
        return;
      }

      redirectUri = `http://localhost:${addr.port}/callback`;

      const authorizationUrl = new URL(AUTHORIZE_URL);
      authorizationUrl.searchParams.set('client_id', clientId);
      authorizationUrl.searchParams.set('redirect_uri', redirectUri);
      authorizationUrl.searchParams.set('response_type', 'code');
      authorizationUrl.searchParams.set('scope', SCOPES);
      authorizationUrl.searchParams.set('state', state);
      authorizationUrl.searchParams.set('code_challenge', codeChallenge);
      authorizationUrl.searchParams.set('code_challenge_method', 'S256');

      console.log(
        chalk.cyan(
          '\nOpening your browser for beehiiv authorization...',
        ),
      );
      console.log(
        chalk.gray(
          `If the browser does not open, visit:\n${authorizationUrl.toString()}\n`,
        ),
      );

      openBrowser(authorizationUrl.toString()).catch(() => {
        console.log(
          chalk.yellow(
            'Could not open browser automatically. Please visit the URL above.',
          ),
        );
      });
    });

    timeoutHandle = setTimeout(() => {
      server.close();
      reject(
        new Error(
          'OAuth flow timed out after 2 minutes. Please try again.',
        ),
      );
    }, OAUTH_TIMEOUT_MS);
  });
}
