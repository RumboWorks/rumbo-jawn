import { Router } from 'express';
import passport from 'passport';
import { registerLocalUser } from '@rumbo/auth';

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
  res.render('pages/auth/login', {
    ...oauthEnabled,
    flash_error: req.session.flash_error ?? null,
  });
  delete req.session.flash_error;
});

router.get('/register', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/');
  res.render('pages/auth/register', {
    ...oauthEnabled,
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
  const { name, email, password } = req.body;
  try {
    const user = await registerLocalUser({ name, email, password });
    const returnTo = req.session.returnTo ?? '/';
    req.login(user, (err) => {
      if (err) return res.redirect('/login');
      res.redirect(returnTo);
    });
  } catch (err) {
    req.session.flash_error = err.message;
    res.redirect('/register');
  }
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
