import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { findOrCreateOAuthUser } from '../user-service.js';

export function buildLinkedInStrategy() {
  return new LinkedInStrategy(
    {
      clientID:     process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL:  '/auth/linkedin/callback',
      scope:        ['openid', 'profile', 'email'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('LinkedIn profile has no email'));
        const user = await findOrCreateOAuthUser({
          provider:   'linkedin',
          providerId: profile.id,
          email,
          name:       profile.displayName,
          firstName:  profile.name?.givenName,
          lastName:   profile.name?.familyName,
          avatarUrl:  profile.photos?.[0]?.value ?? null,
        });
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  );
}
