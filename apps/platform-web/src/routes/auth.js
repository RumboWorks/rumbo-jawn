import { Router } from 'express';
import passport from 'passport';
import { rateLimit } from 'express-rate-limit';
import { db } from '@rumbo/db';
import {
  acceptInvite,
  getInviteByToken,
  provisionSignup,
  registerLocalUser,
  requestPasswordReset,
  resendVerificationEmail,
  resetPasswordWithToken,
  sendVerificationEmail,
  SIGNUP_TIERS,
  verifyEmailToken,
} from '@rumbo/auth';

const router = Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

const oauthEnabled = {
  google_enabled:   !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  linkedin_enabled: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
};

// Public-endpoint rate limits (per client IP; requires trust proxy behind
// Apache so req.ip is the real client). Loopback is exempt: the Playwright QA
// suite and local smoke checks hit the port directly, while real traffic
// arrives through the proxy with a forwarded client IP.
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
function buildLimiter(max) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: req => LOOPBACK.has(req.ip),
  });
}
const signupLimiter = buildLimiter(10);
const loginLimiter = buildLimiter(20);
const passwordLimiter = buildLimiter(5);
const resendLimiter = buildLimiter(5);

// Capture returnTo before any Passport middleware runs.
// Passport 0.6+ regenerates the session on login, clearing session data set beforehand.
// Stashing in res.locals survives the regeneration.
function captureReturnTo(req, res, next) {
  res.locals.returnTo = req.session.returnTo ?? '/';
  next();
}

// ---- Login / register pages ----

router.get('/login', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/');
  if (req.query.invite) req.session.inviteToken = req.query.invite;
  res.render('pages/auth/login', {
    ...oauthEnabled,
    flash_error: req.session.flash_error ?? null,
  });
  delete req.session.flash_error;
});

// Legacy entry point — the tiered signup page replaced it.
router.get('/register', (req, res) => {
  const invite = req.query.invite ? `&invite=${encodeURIComponent(req.query.invite)}` : '';
  res.redirect(`/signup?tier=free${invite}`);
});

// ---- Pricing & tiered signup ----

const TIER_COPY = [
  { key: 'free', name: 'Free', price: 'Free', blurb: 'Try the tools on your own.', features: ['Personal workspace', 'Sounds Like Us and Eval access', 'Soft usage budgets'] },
  { key: 'solo', name: 'Solo', price: 'Paid', blurb: 'For individual professionals.', features: ['Everything in Free', 'Higher usage budgets', 'Priority support'] },
  { key: 'team', name: 'Team', price: 'Paid', blurb: 'Manage one organization together.', features: ['Named organization', 'Invite your team', 'Member management'] },
  { key: 'partner', name: 'Partner', price: 'Paid', blurb: 'Agencies managing client organizations.', features: ['Partner dashboard', 'Create client organizations', 'Co-manager access'] },
];

router.get('/pricing', asyncHandler(async (req, res) => {
  const dbTiers = await db.productTier.findMany({ where: { isActive: true } });
  const dbByKey = Object.fromEntries(dbTiers.map(t => [t.key, t]));
  const tiers = TIER_COPY
    .map(copy => ({
      ...copy,
      priceUsdMonthly: Number(dbByKey[copy.key]?.priceUsdMonthly ?? 0) || null,
      priceUsdAnnual: Number(dbByKey[copy.key]?.priceUsdAnnual ?? 0) || null,
      stripePriceId: dbByKey[copy.key]?.stripePriceId ?? null,
      stripePriceIdAnnual: dbByKey[copy.key]?.stripePriceIdAnnual ?? null,
    }))
    // Free always shows; other tiers only once they have a real price set.
    .filter(t => t.key === 'free' || t.priceUsdMonthly || t.priceUsdAnnual);
  res.render('pages/auth/pricing', { title: 'Pricing', tiers });
}));

router.get('/signup', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/');
  const tier = SIGNUP_TIERS.includes(req.query.tier) ? req.query.tier : 'free';
  const inviteToken = req.query.invite || req.session.inviteToken || null;
  if (inviteToken) req.session.inviteToken = inviteToken;
  res.render('pages/auth/signup', {
    ...oauthEnabled,
    tier,
    tierCopy: TIER_COPY.find(t => t.key === tier),
    inviteToken,
    flash_error: req.session.flash_error ?? null,
  });
  delete req.session.flash_error;
});

router.post('/signup', signupLimiter, async (req, res) => {
  const { firstName, lastName, email, password, orgName, partnerName } = req.body;
  const tier = SIGNUP_TIERS.includes(req.body.tier) ? req.body.tier : 'free';
  const inviteToken = req.body.inviteToken || req.session.inviteToken || null;
  const back = `/signup?tier=${tier}`;
  try {
    if (req.body.acceptTerms !== 'on') {
      throw new Error('Please accept the terms of service to continue.');
    }
    // Invited signups join the inviting org regardless of tier choice;
    // otherwise the tier decides what structure gets provisioned.
    const useInviteProvisioning = Boolean(inviteToken) || tier === 'free' || tier === 'solo';
    const user = await registerLocalUser({
      firstName,
      lastName,
      email,
      password,
      inviteToken,
      termsAcceptedAt: new Date(),
      provisionOrg: useInviteProvisioning,
    });
    if (!useInviteProvisioning) {
      await provisionSignup({ user, tier, orgName, partnerName });
    } else if (!inviteToken && tier === 'solo') {
      await provisionSignup({ user, tier: 'solo' });
    }
    await sendVerificationEmail(user);
    // keepSessionInfo: the session ID still rotates, but stashed pre-auth data
    // (returnTo, SLU's pendingAnalysisUrl) survives the regeneration.
    req.login(user, { keepSessionInfo: true }, (err) => {
      if (err) return res.redirect('/login');
      delete req.session.inviteToken;
      res.redirect('/auth/verify-pending');
    });
  } catch (err) {
    req.session.flash_error = err.message;
    res.redirect(back);
  }
});

// ---- Email verification ----

router.get('/auth/verify-pending', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login');
  if (req.user.emailVerifiedAt) return res.redirect(req.session.returnTo ?? '/');
  res.render('pages/auth/verify-pending', {
    email: req.user.email,
    flash_error: req.session.flash_error ?? null,
    flash_success: req.session.flash_success ?? null,
  });
  delete req.session.flash_error;
  delete req.session.flash_success;
});

router.post('/auth/verify/resend', resendLimiter, async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login');
  try {
    await resendVerificationEmail(req.user.id);
    req.session.flash_success = 'Verification email sent.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect('/auth/verify-pending');
});

router.get('/auth/verify/:token', async (req, res) => {
  try {
    const user = await verifyEmailToken(req.params.token);
    if (req.isAuthenticated() && req.user.id === user.id) {
      const returnTo = req.session.returnTo ?? '/';
      delete req.session.returnTo;
      req.session.flash_success = 'Email verified — welcome aboard.';
      return res.redirect(returnTo);
    }
    req.session.flash_success = 'Email verified. Sign in to continue.';
    return res.redirect(req.isAuthenticated() ? '/' : '/login');
  } catch (err) {
    req.session.flash_error = err.message;
    return res.redirect(req.isAuthenticated() ? '/auth/verify-pending' : '/login');
  }
});

// ---- Local (email/password) ----

router.post('/auth/local',
  loginLimiter,
  captureReturnTo,
  passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }),
  (req, res) => res.redirect(res.locals.returnTo)
);

router.get('/password/forgot', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/account');
  res.render('pages/auth/forgot-password', {
    flash_error: req.session.flash_error ?? null,
    flash_success: req.session.flash_success ?? null,
  });
  delete req.session.flash_error;
  delete req.session.flash_success;
});

router.post('/password/forgot', passwordLimiter, async (req, res) => {
  try {
    await requestPasswordReset(req.body.email);
    req.session.flash_success = 'If that account exists, a reset link has been sent.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect('/password/forgot');
});

router.get('/password/reset/:token', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/account');
  res.render('pages/auth/reset-password', {
    token: req.params.token,
    flash_error: req.session.flash_error ?? null,
  });
  delete req.session.flash_error;
});

router.post('/password/reset/:token', async (req, res) => {
  try {
    const user = await resetPasswordWithToken(req.params.token, req.body.password);
    req.login(user, (err) => {
      if (err) return res.redirect('/login');
      res.redirect('/account');
    });
  } catch (err) {
    req.session.flash_error = err.message;
    res.redirect(`/password/reset/${req.params.token}`);
  }
});

router.get('/invites/:token', async (req, res) => {
  const invite = await getInviteByToken(req.params.token);
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return res.status(404).render('pages/error', { status: 404, message: 'Invitation not found or expired' });
  }

  if (req.isAuthenticated()) {
    try {
      await acceptInvite({ token: req.params.token, userId: req.user.id });
      return res.redirect('/account');
    } catch (err) {
      return res.status(403).render('pages/error', { status: 403, message: err.message });
    }
  }

  req.session.inviteToken = req.params.token;
  res.render('pages/auth/invite', { invite });
});

// ---- Google OAuth ----

router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  captureReturnTo,
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => res.redirect(res.locals.returnTo)
);

// ---- LinkedIn OAuth ----

router.get('/auth/linkedin',
  passport.authenticate('linkedin')
);

router.get('/auth/linkedin/callback',
  captureReturnTo,
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  (req, res) => res.redirect(res.locals.returnTo)
);

// ---- Logout ----

router.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => res.redirect('/'));
  });
});

export default router;
