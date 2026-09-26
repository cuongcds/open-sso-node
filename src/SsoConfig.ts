/**
 * Static configuration for one OAuth-style SSO provider/client. Immutable —
 * build once from your app config and reuse across requests.
 */
export class SsoConfig {
  constructor(
    public readonly providerHost: string,
    public readonly clientId: string,
    public readonly clientSecret: string,
    public readonly callbackUrl: string
  ) {}

  withCallbackUrl(callbackUrl: string): SsoConfig {
    return new SsoConfig(this.providerHost, this.clientId, this.clientSecret, callbackUrl);
  }
}
