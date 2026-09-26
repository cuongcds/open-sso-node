import { HttpClient } from '../src/http/HttpClient';
import { HttpResponse } from '../src/http/HttpResponse';

export class FakeHttpClient implements HttpClient {
  lastUrl: string | null = null;
  lastQuery: Record<string, string> | null = null;
  lastFields: Record<string, string> | null = null;

  constructor(
    private readonly statusCode: number,
    private readonly body: string
  ) {}

  async get(url: string, query: Record<string, string>): Promise<HttpResponse> {
    this.lastUrl = url;
    this.lastQuery = query;

    return new HttpResponse(this.statusCode, this.body);
  }

  async post(url: string, fields: Record<string, string>): Promise<HttpResponse> {
    this.lastUrl = url;
    this.lastFields = fields;

    return new HttpResponse(this.statusCode, this.body);
  }
}
