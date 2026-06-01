import { db } from '@rumbo/db';

const VALID_CATEGORIES = [
  'sounds_right',
  'sounds_wrong',
  'too_generic',
  'too_long',
  'missing_context',
  'other',
];

export async function saveFeedback({ jobId, userId, orgId, rating, comment, category, options }) {
  if (!jobId || !userId) throw new Error('jobId and userId required');
  if (rating < 1 || rating > 5) throw new Error('rating must be 1–5');
  if (category && !VALID_CATEGORIES.includes(category)) throw new Error('invalid category');

  return db.sluFeedback.create({
    data: {
      jobId,
      userId,
      orgId: orgId ?? null,
      rating: Math.round(rating),
      comment: (comment ?? '').trim().slice(0, 2000) || null,
      category: category ?? null,
      options: options ?? null,
    },
  });
}
