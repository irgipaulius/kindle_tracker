# Hyper Reader

A full-stack web app to track books.

Full website: https://hyperreader.eu

## Setup

### 1) Clone the repository

```sh
git clone https://github.com/irgipaulius/kindle_tracker.git
cd kindle_tracker
```

### 2) Configure environment variables

```sh
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3) Install dependencies

```sh
npm run install:all
```

## Scripts (run from repo root)

- `npm run dev`
  - frontend: http://localhost:5173
  - backend: http://localhost:5174

### Production setup:

- `npm run build:all`
  - builds frontend into `client/dist/`

- `npm run serve:backend`
  - starts backend (production mode)

- `npm run serve:frontend`
  - serves built frontend (vite preview)
