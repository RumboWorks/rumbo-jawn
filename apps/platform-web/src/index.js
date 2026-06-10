import 'dotenv/config';
import express from 'express';
import Twig from 'twig';
import { fileURLToPath } from 'url';
import path from 'path';
import {
  buildSessionMiddleware,
  configurePassport,
  listAccessibleOrganizations,
  listAccessibleTools,
  loadActiveOrganization,
  displayNameForUser,
  firstNameForUser,
  primaryOrgIdForUser,
} from '@rumbo/auth';
import { listTools } from '@rumbo/config';
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

const TOOL_REGISTRY = listTools();
const TOOL_REGISTRY_BY_KEY = Object.fromEntries(TOOL_REGISTRY.map(tool => [tool.key, tool]));

// Expose current user and accessible tool nav to all Twig templates.
app.use(async (req, res, next) => {
  try {
  res.locals.currentUser = req.user ?? null;
    res.locals.currentUserDisplayName = req.user ? displayNameForUser(req.user) : null;
    res.locals.currentUserFirstName = req.user ? firstNameForUser(req.user) : null;
    res.locals.currentPath = req.originalUrl;
    res.locals.navTools = [];
    res.locals.toolRegistry = TOOL_REGISTRY;
    res.locals.toolRegistryByKey = TOOL_REGISTRY_BY_KEY;
    res.locals.organizations = [];
    res.locals.activeOrganization = null;
    res.locals.navOrientation = (req.user?.navOrientation ?? 'HORIZONTAL').toLowerCase();
    res.locals.isPartnerManager = Boolean(req.user?.partnerMemberships?.some(m => m.role === 'MANAGER'));
    res.locals.actingAsOrg = false;
    res.locals.primaryOrgId = null;
    if (req.method === 'GET' && req.isAuthenticated()) {
      const organization = await loadActiveOrganization(req);
      res.locals.activeOrganization = organization;
      res.locals.organizations = await listAccessibleOrganizations(req.user);
      res.locals.navTools = await listAccessibleTools(req.user, organization?.id);
      // Platform admin operating inside an org they don't belong to — show the
      // persistent "acting as" banner with a way back to their own org, and
      // surface the acted-as org in the switcher (it is not in their list).
      res.locals.actingAsOrg = Boolean(
        req.user.isPlatformAdmin
        && organization
        && !(req.user.memberships ?? []).some(m => m.orgId === organization.id),
      );
      res.locals.primaryOrgId = primaryOrgIdForUser(req.user);
      if (res.locals.actingAsOrg && !res.locals.organizations.some(org => org.id === organization.id)) {
        res.locals.organizations = [...res.locals.organizations, organization];
      }
    }
    next();
  } catch (err) {
    next(err);
  }
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
