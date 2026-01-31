import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { User } from './schemas/User.js';

export function configurePassport(passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5174';

  if (!GOOGLE_CLIENT_ID) throw new Error('Missing GOOGLE_CLIENT_ID');
  if (!GOOGLE_CLIENT_SECRET) throw new Error('Missing GOOGLE_CLIENT_SECRET');

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${SERVER_URL}/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value || null;
          const name = profile.displayName || email || 'User';
          const picture = profile.photos?.[0]?.value || null;

          const user = await User.findOneAndUpdate(
            { googleId },
            {
              googleId,
              email,
              name,
              picture,
            },
            { new: true, upsert: true }
          );

          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}
