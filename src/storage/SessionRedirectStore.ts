import { RedirectStore } from './RedirectStore';

/** Duck-typed session bag, e.g. `req.session` from express-session. */
export interface SessionLike {
  [key: string]: unknown;
}

/**
 * Default store, backed by a session object such as `req.session`
 * (express-session or any middleware exposing a plain mutable object).
 *
 * Usage: new SessionRedirectStore(req.session)
 */
export class SessionRedirectStore implements RedirectStore {
  constructor(
    private readonly session: SessionLike,
    private readonly sessionKey: string = 'sso_pending_redirect'
  ) {}

  put(redirectTo: string): void {
    if (redirectTo === '') {
      delete this.session[this.sessionKey];
      return;
    }

    this.session[this.sessionKey] = redirectTo;
  }

  pullAndClear(): string | null {
    const value = this.session[this.sessionKey];
    delete this.session[this.sessionKey];

    return typeof value === 'string' && value !== '' ? value : null;
  }
}
