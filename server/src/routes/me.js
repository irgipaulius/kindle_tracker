import { Router } from 'express';

import { requireAuth } from '../middleware/requireAuth.js';
import { User } from '../schemas/User.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture,
    preferredLocale: req.user.preferredLocale,
    genres: req.user.genres || [],
    booksSorting: req.user.booksSorting || [],
  });
});

router.patch('/preferences', requireAuth, async (req, res) => {
  const { preferredLocale, booksSorting } = req.body;

  const update = {};

  if (preferredLocale !== undefined) {
    if (!['en', 'fr'].includes(preferredLocale)) {
      return res.status(400).json({ error: 'invalid_preferredLocale' });
    }
    update.preferredLocale = preferredLocale;
  }

  if (booksSorting !== undefined) {
    if (!Array.isArray(booksSorting)) {
      return res.status(400).json({ error: 'invalid_booksSorting' });
    }

    const normalized = booksSorting
      .filter((s) => s && typeof s.id === 'string')
      .map((s) => ({ id: String(s.id), desc: Boolean(s.desc) }))
      .slice(0, 5);

    update.booksSorting = normalized;
  }

  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });

  res.json({
    id: user.id,
    preferredLocale: user.preferredLocale,
    booksSorting: user.booksSorting || [],
  });
});

router.patch('/genres', requireAuth, async (req, res) => {
  const { genres } = req.body;

  if (!Array.isArray(genres)) {
    return res.status(400).json({ error: 'invalid_genres' });
  }

  const normalized = Array.from(
    new Set(
      genres
        .filter((g) => typeof g === 'string')
        .map((g) => g.trim())
        .filter(Boolean)
    )
  ).slice(0, 200);

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { genres: normalized },
    { new: true }
  );

  res.json({ id: user.id, genres: user.genres || [] });
});

export default router;
