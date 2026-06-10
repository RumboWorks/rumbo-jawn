import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { db } from '@rumbo/db';

export function buildSessionMiddleware() {
  return session({
    secret: process.env.SESSION_SECRET || 'changeme',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // Lax is the CSRF baseline: browsers won't send the session cookie on
      // cross-site POSTs, so foreign forms can't act as the user.
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    store: new PrismaSessionStore(db, {
      checkPeriod: 2 * 60 * 1000, // prune expired sessions every 2 min
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  });
}
