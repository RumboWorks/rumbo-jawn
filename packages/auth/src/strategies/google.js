import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { findOrCreateOAuthUser } from '../user-service.js';

export function buildGoogleStrategy() {
  return new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('Google profile has no email'));
        const user = await findOrCreateOAuthUser({
          provider:   'google',
          providerId: profile.id,
          email,
          name:       profile.displayName,
          avatarUrl:  profile.photos?.[0]?.value ?? null,
        });
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  );
}
