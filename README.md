# Hyper Reader

A full-stack web app to track books.

Production: https://hyperreader.eu

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite (Cloudflare static assets) |
| API | Cloudflare Worker + [Hono](https://hono.dev) |
| Database | Cloudflare D1 (SQLite) |
| Auth | Google OAuth + JWT session cookie |

The legacy Express/Mongo server in [`server/`](server/) is kept for reference but is not used in production.

## One-time setup

### 1) Clone and install

```sh
git clone https://github.com/irgipaulius/kindle_tracker.git
cd kindle_tracker
npm run install:all
```

### 2) Cloudflare D1 database

```sh
npx wrangler d1 create hyperreader
```

Copy the `database_id` from the output into [`wrangler.toml`](wrangler.toml) (`database_id = "..."`).

Apply schema locally:

```sh
npx wrangler d1 migrations apply hyperreader --local
```

For production (you run this before/after first deploy):

```sh
npx wrangler d1 migrations apply hyperreader --remote
```

### 3) Secrets and local env

```sh
cp .dev.vars.example .dev.vars   # must be at repo root, next to wrangler.toml
```

Edit **[`.dev.vars`](.dev.vars) in the repo root** (not `worker/.dev.vars` — Wrangler ignores that):

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` from Google Cloud Console
- `SESSION_SECRET` — long random string
- `APP_URL` — `http://localhost:5173` when using `npm run dev` (see below)

**Google OAuth authorized redirect URIs:**

| Environment | Redirect URI |
|-------------|----------------|
| Local (`npm run dev`) | `http://localhost:5173/auth/google/callback` |
| Production | `https://hyperreader.eu/auth/google/callback` |
| Workers.dev preview | `https://<your-subdomain>.workers.dev/auth/google/callback` |

Use `/auth/google/callback` — **not** `/api/auth/...` (there is no `/api` prefix on auth routes).

### 4) Production secrets (Cloudflare dashboard or CLI)

```sh
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put SESSION_SECRET
```

[`wrangler.toml`](wrangler.toml) sets `APP_URL = "https://hyperreader.eu"` for production.

## Local development

```sh
npm run dev
```

- Frontend: http://localhost:5173 (Vite proxies `/api`, `/auth`, `/health` to the worker)
- Worker: http://localhost:8787

Vite proxy keeps API calls same-origin so session cookies work on port 5173.

### Local smoke test (no Google required)

```sh
curl http://localhost:8787/health
# {"ok":true}
```

### Dev auth backdoor (local only, not in the UI)

After signing in with Google **once** (so your user exists in local D1), add to `.dev.vars`:

```env
DEV_BYPASS_AUTH=true
DEV_AUTH_EMAIL=your@gmail.com
```

Restart `npm run dev`, then open `http://localhost:5173/auth/dev-login` directly (no button in the app). Returns 404 unless `DEV_BYPASS_AUTH=true`. Do not enable in production.

### Legacy MERN stack (optional)

Requires MongoDB and `server/.env`:

```sh
npm run dev:legacy
```

## Deploy

Build the client and deploy the Worker + assets:

```sh
npm run deploy
```

Or connect the repo to **Cloudflare Workers Builds** with build command:

```sh
npm run install:all && npm run build:deploy
```

### Post-deploy checklist

1. `npx wrangler d1 migrations apply hyperreader --remote`
2. Secrets set in Cloudflare (`GOOGLE_*`, `SESSION_SECRET`)
3. Custom domain `hyperreader.eu` attached to the Worker
4. Google OAuth production redirect URI registered
5. Visit `/health`, then sign in and add a book

## Scripts (repo root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Worker + Vite (recommended) |
| `npm run dev:worker` | Wrangler only (port 8787) |
| `npm run dev:legacy` | Old Express server + Vite |
| `npm run build` | Build client → `client/dist/` |
| `npm run deploy` | Build client + `wrangler deploy` |
| `npm run typecheck:worker` | Typecheck the Worker |

## API routes

| Method | Path |
|--------|------|
| GET | `/health` |
| GET | `/auth/google` |
| GET | `/auth/google/callback` |
| POST | `/auth/logout` |
| GET | `/api/me` |
| PATCH | `/api/me/preferences` |
| PATCH | `/api/me/genres` |
| GET/POST | `/api/books` |
| PATCH/DELETE | `/api/books/:id` |
