/**
 * Where the "come back to this page after SSO login" target is kept across
 * the round trip to the SSO provider and back.
 *
 * Some providers do not reliably forward query parameters placed on the
 * callback URL (e.g. appending their own '?token=...' instead of
 * '&token=...', corrupting any query string already present) — so the
 * intended redirect must never be carried as a callback query param. It has
 * to be stashed somewhere on this side (session by default) before leaving
 * for the provider, and read back on return.
 */
export interface RedirectStore {
  put(redirectTo: string): void;

  /**
   * Read and clear the pending redirect target in one step, so a stale
   * value can never leak into a later, unrelated login.
   */
  pullAndClear(): string | null;
}
