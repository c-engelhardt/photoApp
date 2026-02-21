# PhotoApp

PhotoApp is a single-uploader photo gallery with invite-only access and share links. It is built for a private server with scalable read access and protected media delivery.

## Features

- Invite-only viewer accounts
- Admin uploads with tags and albums
- Share links with configurable expiration
- Protected media delivery via Nginx X-Accel-Redirect
- EXIF stripped by default

## Tech stack

- Backend: Node.js, Fastify, Prisma
- Database: PostgreSQL
- Frontend: React (Vite)
- Media: Sharp
- Email: SendGrid

## Quick start

1) Copy `.env.example` to `.env` and fill values.
2) Install dependencies:
   - `npm install --prefix server`
   - `npm install --prefix client`
3) Run migrations and seed admin:
   - `npm --prefix server run prisma:generate`
   - `npm --prefix server run prisma:migrate`
   - `npm --prefix server run seed`
4) Start dev servers:
   - `npm --prefix server run dev`
   - `npm --prefix client run dev`

For full details see `docs/SETUP.md`.
