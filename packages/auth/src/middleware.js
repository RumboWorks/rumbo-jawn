// requireAuth — redirect to /login if the user is not authenticated.
export function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
}

// requireAdmin — 403 if the user is not a platform admin.
// Admin flag is a placeholder until Phase 06 adds an admin role on User.
export function requireAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user?.isAdmin) return next();
  res.status(403).render('pages/error', { status: 403, message: 'Forbidden' });
}
