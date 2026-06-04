export const THEMES = Object.freeze(['light', 'dark', 'paper', 'pink']);
export const DENSITIES = Object.freeze(['comfortable', 'compact']);
export const NAV_ORIENTATIONS = Object.freeze(['horizontal', 'vertical']);

export function normalizeChoice(value, choices, fallback) {
  return choices.includes(value) ? value : fallback;
}

export function applyLocalUiPreferences(root = document.documentElement, storage = localStorage) {
  const theme = normalizeChoice(storage.getItem('rj-theme'), THEMES, 'paper');
  const density = normalizeChoice(storage.getItem('rj-density'), DENSITIES, 'comfortable');
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-density', density);
  return { theme, density };
}
