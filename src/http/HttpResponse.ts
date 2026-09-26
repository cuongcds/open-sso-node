export class HttpResponse {
  constructor(
    public readonly statusCode: number,
    public readonly body: string
  ) {}

  json(): Record<string, unknown> {
    try {
      const decoded = JSON.parse(this.body);
      return decoded !== null && typeof decoded === 'object' && !Array.isArray(decoded)
        ? (decoded as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
}
