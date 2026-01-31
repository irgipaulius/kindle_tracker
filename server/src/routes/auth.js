import { Router } from 'express';
import passport from 'passport';

const router = Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${CLIENT_URL}/login`,
    session: true,
  }),
  (req, res) => {
    res.redirect(`${CLIENT_URL}/app`);
  }
);

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ ok: true });
    });
  });
});

export default router;
