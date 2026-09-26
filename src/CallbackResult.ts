import { SsoUser } from './SsoUser';

/**
 * Outcome of SsoClient#handleCallback(): either a resolved remote user with
 * a redirect target to send the browser to, or a failure to display.
 */
export class CallbackResult {
  private constructor(
    public readonly success: boolean,
    public readonly user: SsoUser | null,
    public readonly redirectTo: string | null,
    public readonly errorMessage: string | null
  ) {}

  static success(user: SsoUser, redirectTo: string | null): CallbackResult {
    return new CallbackResult(true, user, redirectTo, null);
  }

  static failure(errorMessage: string): CallbackResult {
    return new CallbackResult(false, null, null, errorMessage);
  }
}
