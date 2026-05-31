import passport from 'passport';
import { buildGoogleStrategy } from './strategies/google.js';
import { buildLinkedInStrategy } from './strategies/linkedin.js';
import { buildLocalStrategy } from './strategies/local.js';
import { loadUser } from './user-service.js';

export function configurePassport() {
  passport.use(buildLocalStrategy());

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(buildGoogleStrategy());
  }

  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    passport.use(buildLinkedInStrategy());
  }

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await loadUser(id);
      done(null, user ?? false);
    } catch (err) {
      done(err);
    }
  });

  return passport;
}
