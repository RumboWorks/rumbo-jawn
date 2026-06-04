import { Router } from 'express';
import passport from 'passport';
import {
  acceptInvite,
  getInviteByToken,
  registerLocalUser,
  requestPasswordReset,
  resetPasswordWithToken,
} from '@rumbo/auth';

const router = Router();

const oauthEnabled = {
  google_enabled:   !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  linkedin_enabled: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
};

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

router.get('/register', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/');
  const inviteToken = req.query.invite || req.session.inviteToken || null;
  if (inviteToken) req.session.inviteToken = inviteToken;
  res.render('pages/auth/register', {
    ...oauthEnabled,
    inviteToken,
    flash_error: req.session.flash_error ?? null,
  });
  delete req.session.flash_error;
});

// ---- Local (email/password) ----

router.post('/auth/local',
  captureReturnTo,
  passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }),
  (req, res) => res.redirect(res.locals.returnTo)
);

router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const inviteToken = req.body.inviteToken || req.session.inviteToken || null;
  try {
    const user = await registerLocalUser({ firstName, lastName, email, password, inviteToken });
    const returnTo = req.session.returnTo ?? '/';
    req.login(user, (err) => {
      if (err) return res.redirect('/login');
      delete req.session.inviteToken;
      res.redirect(returnTo);
    });
  } catch (err) {
    req.session.flash_error = err.message;
    res.redirect('/register');
  }
});

router.get('/password/forgot', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/account');
  res.render('pages/auth/forgot-password', {
    flash_error: req.session.flash_error ?? null,
    flash_success: req.session.flash_success ?? null,
  });
  delete req.session.flash_error;
  delete req.session.flash_success;
});

router.post('/password/forgot', async (req, res) => {
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
