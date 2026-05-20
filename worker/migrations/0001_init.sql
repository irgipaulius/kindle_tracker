CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_id TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT NOT NULL,
  picture TEXT,
  preferred_locale TEXT NOT NULL DEFAULT 'en' CHECK (preferred_locale IN ('en', 'fr')),
  genres_json TEXT NOT NULL DEFAULT '[]',
  books_sorting_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE books (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sort_index INTEGER NOT NULL DEFAULT 0,
  title TEXT,
  author TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'to_read' CHECK (status IN ('to_read', 'reading', 'read')),
  downloaded INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  date TEXT,
  finished_at TEXT,
  genre TEXT,
  language TEXT,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX books_user_id_created_at ON books(user_id, created_at DESC);
CREATE INDEX books_user_id_sort_index ON books(user_id, sort_index);
