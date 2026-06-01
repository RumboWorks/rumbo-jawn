import { getBestPracticePacksPackage } from './config/config-loader.js';

export const BEST_PRACTICE_PACKS = getBestPracticePacksPackage().packs;

export const BEST_PRACTICE_PACKS_MAP = Object.fromEntries(
  BEST_PRACTICE_PACKS.filter(p => p.id !== 'none').map(p => [p.id, p])
);
