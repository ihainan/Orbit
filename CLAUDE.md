# Orbitals — Claude Notes

## General Rules

- No emoji in code, UI, or docs unless explicitly required.
- Use English for all code, comments, and documentation unless explicitly required otherwise.
- No Anthropic/Claude authorship info in git commits.

## Project

Single-user, no authentication. All operations resolve to the one row in `users` via `User.getDefault()`.

## Tech Stack

- **Backend**: Node.js + Express, port 51001
- **Frontend**: React + Vite, port 51002 (proxies `/api` and `/uploads` to backend)
- **Database**: PostgreSQL, port 51000 (dev)
- **Production serving**: nginx embedded in the frontend container

## Dev Setup

```
docker/dev/   → starts PostgreSQL only (compose.yml)
backend/      → npm run dev  (runs migrations then nodemon)
frontend/     → npm run dev
```

Copy `.env.example` to `.env` in both `docker/dev/` and `backend/`. `DB_PASSWORD` must match in both.

## Database Migrations

- All migrations live in `backend/migrations/` and are managed by `node-pg-migrate`.
- Create a new migration: `cd backend && npm run migrate:create -- <description>`
- Migrations run automatically on every backend startup (dev and prod).

## First-Run Requirements

`DEFAULT_USERNAME` and `DEFAULT_EMAIL` must be set before the first run. The backend will refuse to start if the `users` table is empty and these are missing.

## Data Persistence

All mounted host directories live under `./data/` relative to the compose file (`docker/dev/` or `docker/prod/`).
