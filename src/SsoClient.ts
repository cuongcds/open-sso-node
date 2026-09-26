import { CallbackResult } from './CallbackResult';
import { TokenExchangeException } from './exceptions/TokenExchangeException';
import { FetchHttpClient } from './http/FetchHttpClient';
import { HttpClient } from './http/HttpClient';
import { RedirectStore } from './storage/RedirectStore';
import { SsoConfig } from './SsoConfig';
import { SsoUser } from './SsoUser';

/**
 * Client for a generic OAuth-style "login via SSO" flow used across apps:
 *
 *   1. getLoginUrl(redirectTo) -> redirect the browser here to start login.
 *   2. The provider redirects back to your callback route with ?token=...
 *   3. handleCallback() exchanges the token for the remote user and returns
 *      the redirect target you originally asked for in step 1.
 *
 * The intended post-login redirect is deliberately never placed on the
 * callback URL query string — see storage/RedirectStore for why. Route the
 * returned SsoUser into your own user/session model; this SDK only speaks
 * the provider's protocol, it does not know your app's user schema.
 */
export class SsoClient {
  private readonly httpClient: HttpClient;

  constructor(
    private readonly config: SsoConfig,
    private readonly redirectStore: RedirectStore,
    httpClient?: HttpClient
  ) {
    this.httpClient = httpClient ?? new FetchHttpClient();
  }

  /**
   * Build the URL to send the browser to in order to start SSO login.
   * Stashes redirectTo (e.g. the originally requested URI) so it survives
   * the round trip to the provider and back.
   */
  getLoginUrl(redirectTo?: string | null): string {
    this.redirectStore.put(redirectTo ?? '');

    const query = new URLSearchParams({
      callback: this.config.callbackUrl,
      client_id: this.config.clientId,
    }).toString();

    return `${this.config.providerHost.replace(/\/+$/, '')}/login?${query}`;
  }

  /**
   * Handle the browser landing back on your callback route.
   *
   * @param token the 'token' query param the provider sent back
   */
  async handleCallback(token: string | null | undefined): Promise<CallbackResult> {
    // Read + clear before anything else, so it can't be lost to any
    // session writes the caller performs while acting on the result.
    const redirectTo = this.redirectStore.pullAndClear();

    if (token === null || token === undefined || token === '') {
      return CallbackResult.failure('Missing SSO token');
    }

    try {
      const user = await this.exchangeToken(token);
      return CallbackResult.success(user, redirectTo);
    } catch (e) {
      if (e instanceof TokenExchangeException) {
        return CallbackResult.failure(e.message);
      }
      throw e;
    }
  }

  private async exchangeToken(token: string): Promise<SsoUser> {
    let response;
    try {
      // POST, not GET - client_secret must never end up in a URL
      // (access logs, browser history, proxies, Referer headers).
      response = await this.httpClient.post(
        `${this.config.providerHost.replace(/\/+$/, '')}/oauth/token`,
        {
          token,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }
      );
    } catch (e) {
      throw new TokenExchangeException(`Failed to reach SSO provider: ${(e as Error).message}`, {
        cause: e,
      });
    }

    const data = response.json();

    if (response.statusCode >= 400 || !data.email) {
      throw new TokenExchangeException('SSO provider rejected the token or returned no user');
    }

    return SsoUser.fromRecord(data);
  }
}
