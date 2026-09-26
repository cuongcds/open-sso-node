import { RedirectStore } from '../src/storage/RedirectStore';

/** In-memory RedirectStore for tests, standing in for a real session. */
export class ArrayRedirectStore implements RedirectStore {
  private value: string | null = null;

  put(redirectTo: string): void {
    this.value = redirectTo === '' ? null : redirectTo;
  }

  pullAndClear(): string | null {
    const value = this.value;
    this.value = null;

    return value;
  }
}
