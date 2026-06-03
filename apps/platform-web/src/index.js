import 'dotenv/config';
import express from 'express';
import Twig from 'twig';
import { fileURLToPath } from 'url';
import path from 'path';
import { buildSessionMiddleware, configurePassport, listAccessibleTools, primaryOrgIdForUser } from '@rumbo/auth';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

// View engine
app.engine('twig', Twig.__express);
app.set('view engine', 'twig');
app.set('views', path.join(__dirname, '../views'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session + Passport
app.use(buildSessionMiddleware());
const passport = configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Reliable flash: flash messages live in the session, which the Prisma store
// persists asynchronously. Without this, a POST that sets a flash and redirects
// can race the following GET (the store write may not be durable yet), so the
// banner is missed or stale. Persist the session before any redirect that has a
// flash pending, so the next request always reads the latest value.
app.use((req, res, next) => {
  const originalRedirect = res.redirect.bind(res);
  res.redirect = (...args) => {
    if (req.session && (req.session.flash_success || req.session.flash_error)) {
      req.session.save(() => originalRedirect(...args));
    } else {
      originalRedirect(...args);
    }
  };
  next();
});

// Cosmetic nav list cache. The header tool list is purely presentational — the
// authoritative access check lives in requireToolAccess, which is never cached.
// The lookup is non-blocking: a cache miss returns what we have (possibly empty)
// and refreshes in the background, so no awaited DB work sits on the page-load
// hot path. The header menu therefore appears from the second page load; the
// home route fetches its own launcher list directly, so the launcher is always
// complete. Staleness of up to ~30s in the header menu is acceptable.
const navCache = new Map(); // userId -> { tools, expires }
const NAV_TTL_MS = 30_000;

function getNavToolsCached(user, orgId) {
  const cached = navCache.get(user.id);
  if (cached && cached.expires > Date.now()) return cached.tools;
  listAccessibleTools(user, orgId)
    .then(tools => navCache.set(user.id, { tools, expires: Date.now() + NAV_TTL_MS }))
    .catch(() => {});
  return cached?.tools ?? [];
}

// Expose current user and accessible tool nav to all Twig templates.
app.use((req, res, next) => {
  res.locals.currentUser = req.user ?? null;
  res.locals.navTools = (req.method === 'GET' && req.isAuthenticated())
    ? getNavToolsCached(req.user, primaryOrgIdForUser(req.user))
    : [];
  next();
});

// Routes
app.use('/', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('pages/error', { status: 404, message: 'Page not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).render('pages/error', { status: 500, message: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`rumbo-web listening on port ${PORT}`);
});
