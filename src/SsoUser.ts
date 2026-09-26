/** The remote user resolved from a provider token exchange. */
export class SsoUser {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly displayName: string | null = null,
    public readonly avatar: string | null = null
  ) {}

  static fromRecord(data: Record<string, unknown>): SsoUser {
    const displayName = data.display_name;
    const avatar = data.avatar;

    return new SsoUser(
      typeof data.email === 'string' ? data.email : String(data.email ?? ''),
      typeof data.name === 'string' ? data.name : String(data.name ?? ''),
      displayName !== undefined && displayName !== null && displayName !== ''
        ? String(displayName)
        : null,
      avatar !== undefined && avatar !== null && avatar !== '' ? String(avatar) : null
    );
  }
}
