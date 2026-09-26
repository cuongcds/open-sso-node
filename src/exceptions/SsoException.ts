/** Base exception for all errors raised by the SDK. */
export class SsoException extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SsoException';
    Object.setPrototypeOf(this, SsoException.prototype);
  }
}
