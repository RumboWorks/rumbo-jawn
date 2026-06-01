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
