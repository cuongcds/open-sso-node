import { SsoException } from './SsoException';

/**
 * Thrown when the SSO provider rejects the token exchange, or returns a
 * response that doesn't carry a usable remote user (e.g. missing email).
 */
export class TokenExchangeException extends SsoException {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'TokenExchangeException';
    Object.setPrototypeOf(this, TokenExchangeException.prototype);
  }
}
