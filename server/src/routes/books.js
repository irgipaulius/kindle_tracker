import { Router } from 'express';

import { requireAuth } from '../middleware/requireAuth.js';
import { Book } from '../schemas/Book.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const books = await Book.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(books);
});

router.post('/', requireAuth, async (req, res) => {
  const {
    title,
    author,
    coverUrl,
    status,
    downloaded,
    rating,
    date,
    finishedDate,
    genre,
    language,
    comment,
  } = req.body;

  const last = await Book.findOne({ userId: req.user.id }).sort({ index: -1 }).select({ index: 1 });
  const nextIndex = (last?.index || 0) + 1;

  const book = await Book.create({
    userId: req.user.id,
    index: nextIndex,
    title,
    author,
    coverUrl,
    status,
    downloaded: Boolean(downloaded),
    rating: typeof rating === 'number' ? rating : 0,
    date,
    finishedDate: finishedDate ? new Date(finishedDate) : undefined,
    genre,
    language,
    comment,
  });

  res.status(201).json(book);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const allowed = [
    'index',
    'title',
    'author',
    'coverUrl',
    'status',
    'downloaded',
    'rating',
    'date',
    'finishedDate',
    'genre',
    'language',
    'comment',
  ];

  const update = {};
  for (const key of allowed) {
    if (key in req.body) update[key] = req.body[key];
  }

  if ('downloaded' in update) update.downloaded = Boolean(update.downloaded);

  if ('rating' in update) {
    const r = Number(update.rating);
    update.rating = Number.isFinite(r) ? r : 0;
  }

  if ('index' in update) {
    const n = Number(update.index);
    update.index = Number.isFinite(n) ? n : 0;
  }

  if ('finishedDate' in update) {
    if (!update.finishedDate) {
      update.finishedDate = null;
    } else {
      const d = new Date(update.finishedDate);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ error: 'invalid_finishedDate' });
      }
      update.finishedDate = d;
    }
  }
  const updated = await Book.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    update,
    { new: true }
  );

  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json(updated);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const book = await Book.findOne({ _id: req.params.id, userId: req.user.id });
  if (!book) return res.status(404).json({ error: 'not_found' });

  await book.deleteOne();
  res.json({ ok: true });
});

export default router;
