# Local setup

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm

## Environment

Copy `.env.example` to `.env` and update values.

For local development, set `MEDIA_ROOT` to an absolute path you can write to, for example `./media` or `C:\\photoapp\\media`.

## Install dependencies

- `npm install --prefix server`
- `npm install --prefix client`

## Database

Create a database and user in Postgres, then update `DATABASE_URL`.

Run migrations and generate Prisma client:

- `npm --prefix server run prisma:generate`
- `npm --prefix server run prisma:migrate`

Seed the initial admin from `.env`:

- `npm --prefix server run seed`

## Start development servers

- Backend: `npm --prefix server run dev`
- Frontend: `npm --prefix client run dev`

The API runs on `http://localhost:3000` and the SPA on `http://localhost:5173`.
