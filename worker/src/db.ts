export type UserRow = {
  id: string;
  google_id: string;
  email: string | null;
  name: string;
  picture: string | null;
  preferred_locale: string;
  genres_json: string;
  books_sorting_json: string;
  books_filter_json: string;
  created_at: string;
  updated_at: string;
};

export type BookRow = {
  id: string;
  user_id: string;
  sort_index: number;
  title: string | null;
  author: string | null;
  cover_url: string | null;
  status: string;
  downloaded: number;
  rating: number;
  date: string | null;
  finished_at: string | null;
  genre: string | null;
  language: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

export async function findUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<UserRow>();
}

export async function findUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<UserRow>();
}

export async function upsertUserFromGoogle(
  db: D1Database,
  input: { googleId: string; email: string | null; name: string; picture: string | null }
): Promise<UserRow> {
  const id = crypto.randomUUID();
  const row = await db
    .prepare(
      `INSERT INTO users (id, google_id, email, name, picture)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(google_id) DO UPDATE SET
         email = excluded.email,
         name = excluded.name,
         picture = excluded.picture,
         updated_at = datetime('now')
       RETURNING *`
    )
    .bind(id, input.googleId, input.email, input.name, input.picture)
    .first<UserRow>();

  if (!row) throw new Error('upsert_user_failed');
  return row;
}
