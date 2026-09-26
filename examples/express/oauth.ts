import { Router } from 'express';
import { SessionRedirectStore, SsoClient, SsoConfig } from 'open-sso-node';

const config = new SsoConfig(
  process.env.SSO_PROVIDER_HOST!,
  process.env.SSO_CLIENT_ID!,
  process.env.SSO_CLIENT_SECRET!,
  `${process.env.APP_BASE_URL}/oauth/callback`
);

export const oauthRouter = Router();

oauthRouter.get('/oauth/login', (req, res) => {
  const sso = new SsoClient(config, new SessionRedirectStore(req.session));
  const redirectTo = typeof req.query.redirect === 'string' ? req.query.redirect : null;

  res.redirect(sso.getLoginUrl(redirectTo));
});

oauthRouter.get('/oauth/callback', async (req, res) => {
  const sso = new SsoClient(config, new SessionRedirectStore(req.session));
  const token = typeof req.query.token === 'string' ? req.query.token : null;

  const result = await sso.handleCallback(token);

  if (!result.success) {
    req.session.flash = { error: 'Lỗi khi đăng nhập qua SSO.' };
    return res.redirect('/login');
  }

  // result.user.email / .name / .displayName / .avatar
  // Map to your own user table / session here (this SDK doesn't touch your
  // user model — it only speaks the provider's protocol).

  res.redirect(result.redirectTo || '/portal');
});
