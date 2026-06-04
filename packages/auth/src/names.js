function clean(value) {
  const trimmed = String(value || '').trim().replace(/\s+/g, ' ');
  return trimmed || null;
}

export function splitName(name) {
  const full = clean(name);
  if (!full) return { firstName: null, lastName: null };
  const [firstName, ...rest] = full.split(' ');
  return { firstName, lastName: rest.join(' ') || null };
}

export function normalizePersonName({ firstName, lastName, name } = {}) {
  const fallback = splitName(name);
  const normalizedFirst = clean(firstName) ?? fallback.firstName;
  const normalizedLast = clean(lastName) ?? fallback.lastName;
  const fullName = [normalizedFirst, normalizedLast].filter(Boolean).join(' ') || clean(name);
  return { firstName: normalizedFirst, lastName: normalizedLast, name: fullName };
}

export function displayNameForUser(user) {
  return user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'User';
}

export function firstNameForUser(user) {
  return user?.firstName || splitName(user?.name).firstName || user?.email?.split('@')[0] || 'Your';
}
