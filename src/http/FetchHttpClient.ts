import { SsoException } from '../exceptions/SsoException';
import { HttpClient } from './HttpClient';
import { HttpResponse } from './HttpResponse';

/** Default transport, backed by the global `fetch` (Node 18+). */
export class FetchHttpClient implements HttpClient {
  constructor(private readonly timeoutMs: number = 10_000) {}

  async get(url: string, query: Record<string, string>): Promise<HttpResponse> {
    const qs = new URLSearchParams(query).toString();
    const fullUrl = qs === '' ? url : `${url}?${qs}`;

    return this.send(fullUrl, { method: 'GET' });
  }

  async post(url: string, fields: Record<string, string>): Promise<HttpResponse> {
    return this.send(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    });
  }

  private async send(url: string, init: RequestInit): Promise<HttpResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      const body = await response.text();

      return new HttpResponse(response.status, body);
    } catch (e) {
      throw new SsoException(`HTTP request failed: ${(e as Error).message}`, { cause: e });
    } finally {
      clearTimeout(timer);
    }
  }
}
