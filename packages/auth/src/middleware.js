import { listPartnerAccountsForUser } from './partner-service.js';

// requireAuth — redirect to /login if the user is not authenticated.
export function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
}

// requireAdmin — 403 if the user is not a platform admin.
export function requireAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user?.isPlatformAdmin) return next();
  res.status(403).render('pages/error', { status: 403, message: 'Forbidden' });
}

export const requirePlatformAdmin = requireAdmin;

// requirePartnerManager — 403 unless the user manages at least one partner
// account (or is a platform admin). Loads the managed accounts onto
// req.partnerAccounts for downstream handlers.
export function requirePartnerManager(req, res, next) {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  listPartnerAccountsForUser(req.user.id)
    .then((accounts) => {
      if (accounts.length === 0 && !req.user.isPlatformAdmin) {
        return res.status(403).render('pages/error', { status: 403, message: 'Forbidden' });
      }
      req.partnerAccounts = accounts;
      next();
    })
    .catch(next);
}
