import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { createUserFromInviteIfNeeded, isActiveUser } from '../account-service.js';
import { findUserByEmail } from '../user-service.js';
import { db } from '@rumbo/db';

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

// Register a new user with email + password.
export async function registerLocalUser({ email, name, password, inviteToken = null }) {
  const existing = await findUserByEmail(email.toLowerCase().trim());
  if (existing) throw new Error('An account with this email already exists.');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { email: email.toLowerCase().trim(), name, passwordHash },
  });
  await createUserFromInviteIfNeeded(user, inviteToken);
  return user;
}
