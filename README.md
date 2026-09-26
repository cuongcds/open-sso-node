# open-sso-node

Generic OAuth-style "Login via SSO" client for Node apps: builds the login
redirect URL and handles the callback token exchange against any provider
that speaks this simple protocol (`GET /login?callback=...&client_id=...`
followed by a `POST /oauth/token` exchange). Node port of the
[ci3-open-sso](../ci3-open-sso) PHP SDK, same protocol and shape.

## Install

```bash
npm install open-sso-node
```

## Why a redirect store abstraction?

Some SSO providers do not forward query parameters placed on the callback
URL correctly — e.g. appending their own `?token=...` with a bare `?` instead
of `&`, so a callback URL that already has `?redirect=...` ends up corrupted
(`...?redirect=foo?token=bar`, which gets parsed as a single garbage
`redirect` value, silently dropping the token). Because of this, the "where
to send the user after login" value must never be carried on the callback
URL — it has to be stashed on your side (session, by default) before leaving
for the provider and read back on return. This is exactly what
`RedirectStore` is for.

## Usage (Express)

```ts
import { SsoClient, SsoConfig, SessionRedirectStore } from 'open-sso-node';

const config = new SsoConfig(
  process.env.SSO_PROVIDER_HOST!,
  process.env.SSO_CLIENT_ID!,
  process.env.SSO_CLIENT_SECRET!,
  `${process.env.APP_BASE_URL}/oauth/callback`
);
```

### Starting login

```ts
app.get('/oauth/login', (req, res) => {
  const sso = new SsoClient(config, new SessionRedirectStore(req.session));
  const redirectTo = typeof req.query.redirect === 'string' ? req.query.redirect : null;

  res.redirect(sso.getLoginUrl(redirectTo));
});
```

### Handling the callback

```ts
app.get('/oauth/callback', async (req, res) => {
  const sso = new SsoClient(config, new SessionRedirectStore(req.session));
  const token = typeof req.query.token === 'string' ? req.query.token : null;

  const result = await sso.handleCallback(token);

  if (!result.success) {
    return res.redirect('/login');
  }

  // result.user.email / .name / .displayName
  // Map to your own user table / session here — this SDK doesn't touch
  // your user model, it only speaks the provider's protocol.

  res.redirect(result.redirectTo || '/portal');
});
```

A full router example is in [examples/express/oauth.ts](examples/express/oauth.ts).

## Custom redirect storage

The default `SessionRedirectStore` wraps any session-like object (e.g.
`req.session` from `express-session`, only plain property access is used).
Implement `RedirectStore` (`put()` / `pullAndClear()`) to back it with
something else (e.g. a signed cookie) if needed.

## Custom HTTP transport

The client uses a `fetch`-based transport by default (Node 18+). Swap it by
implementing `HttpClient` and passing it as the third constructor argument to
`SsoClient`.

## Errors

- `SsoException` — base class, also thrown on transport-level failures
  (network error, timeout).
- `TokenExchangeException` — the provider rejected the token, or returned a
  response with no usable email. Surfaced as `CallbackResult.failure(message)`
  from `handleCallback()`, not thrown.

## Reference

Ported from [`ci3-open-sso`](../ci3-open-sso), a CodeIgniter 3 SDK extracted
from a production app's SSO controller — see that repo's README for the root
cause behind the redirect-store abstraction.
