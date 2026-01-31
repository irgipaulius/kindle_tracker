import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import passport from 'passport';

import { configurePassport } from './passport.js';
import authRouter from './routes/auth.js';
import meRouter from './routes/me.js';
import booksRouter from './routes/books.js';

dotenv.config();
dotenv.config({ path: new URL('../../.env', import.meta.url).pathname, override: false });

const PORT = process.env.PORT || 5174;
const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

if (!MONGODB_URI) throw new Error('Missing MONGODB_URI');
if (!SESSION_SECRET) throw new Error('Missing SESSION_SECRET');

await mongoose.connect(MONGODB_URI);

const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    },
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      collectionName: 'sessions',
    }),
  })
);

configurePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/books', booksRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
