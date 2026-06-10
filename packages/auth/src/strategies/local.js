import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { createUserFromInviteIfNeeded, isActiveUser } from '../account-service.js';
import { findUserByEmail } from '../user-service.js';
import { db } from '@rumbo/db';
import { normalizePersonName } from '../names.js';

export function buildLocalStrategy() {
  return new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await findUserByEmail(email.toLowerCase().trim());
        if (!user || !user.passwordHash) {
          return done(null, false, { message: 'Invalid email or password.' });
        }
        if (!isActiveUser(user)) {
          return done(null, false, { message: 'Account is not active.' });
        }
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
          return done(null, false, { message: 'Invalid email or password.' });
        }
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  );
}

// Register a new user with email + password. `provisionOrg: false` skips the
// default personal-org/invite provisioning so tiered signup (team/partner)
// can create its own structure instead.
export async function registerLocalUser({ email, name, firstName, lastName, password, inviteToken = null, termsAcceptedAt = null, provisionOrg = true }) {
  const existing = await findUserByEmail(email.toLowerCase().trim());
  if (existing) throw new Error('An account with this email already exists.');
  const passwordHash = await bcrypt.hash(password, 12);
  const personName = normalizePersonName({ name, firstName, lastName });
  if (!personName.firstName || !personName.lastName) throw new Error('First and last name are required.');
  const user = await db.user.create({
    data: { email: email.toLowerCase().trim(), ...personName, passwordHash, termsAcceptedAt },
  });
  if (provisionOrg) await createUserFromInviteIfNeeded(user, inviteToken);
  return user;
}
