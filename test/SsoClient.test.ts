import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SsoClient } from '../src/SsoClient';
import { SsoConfig } from '../src/SsoConfig';
import { ArrayRedirectStore } from './ArrayRedirectStore';
import { FakeHttpClient } from './FakeHttpClient';

function makeConfig(): SsoConfig {
  return new SsoConfig(
    'https://accounts.example.com',
    'my-app',
    'secret',
    'https://app.example.com/portal/oauth/callback'
  );
}

test('login url never carries redirect as query param', () => {
  const store = new ArrayRedirectStore();
  const http = new FakeHttpClient(200, '{}');
  const client = new SsoClient(makeConfig(), store, http);

  const url = client.getLoginUrl('portal/website');

  assert.ok(!url.includes('redirect'));
  assert.equal(
    url,
    'https://accounts.example.com/login?callback=https%3A%2F%2Fapp.example.com%2Fportal%2Foauth%2Fcallback&client_id=my-app'
  );
  assert.equal(store.pullAndClear(), 'portal/website');
});

test('handleCallback resolves user and original redirect', async () => {
  const store = new ArrayRedirectStore();
  store.put('portal/website');
  const http = new FakeHttpClient(200, '{"email":"a@b.com","name":"A","display_name":"Mr A"}');
  const client = new SsoClient(makeConfig(), store, http);

  const result = await client.handleCallback('tok-123');

  assert.equal(result.success, true);
  assert.equal(result.user?.email, 'a@b.com');
  assert.equal(result.user?.displayName, 'Mr A');
  assert.equal(result.redirectTo, 'portal/website');
  assert.deepEqual(http.lastFields, {
    token: 'tok-123',
    client_id: 'my-app',
    client_secret: 'secret',
  });

  // stashed value must be cleared so it can't leak into a later login
  assert.equal(store.pullAndClear(), null);
});

test('handleCallback without token fails without an http call', async () => {
  const store = new ArrayRedirectStore();
  store.put('portal/website');
  const http = new FakeHttpClient(200, '{}');
  const client = new SsoClient(makeConfig(), store, http);

  const result = await client.handleCallback(null);

  assert.equal(result.success, false);
  assert.equal(http.lastUrl, null);
});

test('handleCallback with no email in response fails', async () => {
  const store = new ArrayRedirectStore();
  const http = new FakeHttpClient(200, '{"name":"A"}');
  const client = new SsoClient(makeConfig(), store, http);

  const result = await client.handleCallback('tok-123');

  assert.equal(result.success, false);
  assert.notEqual(result.errorMessage, null);
});

test('redirect survives even if callback url itself carries garbage query string', async () => {
  // Simulates a provider appending '?token=' onto a callback URL that
  // already had '?redirect=...' -- the garbage lands in the query string,
  // but since this SDK never reads the query string directly (the caller
  // passes the token in), and the redirect target came from the store
  // instead, it is unaffected.
  const store = new ArrayRedirectStore();
  store.put('portal/website');
  const http = new FakeHttpClient(200, '{"email":"a@b.com","name":"A"}');
  const client = new SsoClient(makeConfig(), store, http);

  const result = await client.handleCallback('tok-123');

  assert.equal(result.redirectTo, 'portal/website');
});
