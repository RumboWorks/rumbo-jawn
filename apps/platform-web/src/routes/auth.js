import { Router } from 'express';
import passport from 'passport';
import { registerLocalUser } from '@rumbo/auth';

const router = Router();

const oauthEnabled = {
  google_enabled:   !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  linkedin_enabled: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
};

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
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureMessage:  true,
  }),
  (req, res) => {
    const returnTo = req.session.returnTo ?? '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
  }
);

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await registerLocalUser({ name, email, password });
    req.login(user, (err) => {
      if (err) return res.redirect('/login');
      res.redirect('/');
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
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const returnTo = req.session.returnTo ?? '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
  }
);

// ---- LinkedIn OAuth ----

router.get('/auth/linkedin',
  passport.authenticate('linkedin')
);

router.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  (req, res) => {
    const returnTo = req.session.returnTo ?? '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
  }
);

// ---- Logout ----

router.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => res.redirect('/'));
  });
});

export default router;
