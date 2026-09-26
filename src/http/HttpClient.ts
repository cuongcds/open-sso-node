import { HttpResponse } from './HttpResponse';

export interface HttpClient {
  /**
   * Send a GET request with query string parameters.
   *
   * @throws SsoException on transport-level failure
   */
  get(url: string, query: Record<string, string>): Promise<HttpResponse>;

  /**
   * Send a POST request with a form-urlencoded body.
   *
   * @throws SsoException on transport-level failure
   */
  post(url: string, fields: Record<string, string>): Promise<HttpResponse>;
}
