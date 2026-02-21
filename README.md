# PhotoApp

PhotoApp is a private, invite-only photo gallery for self-hosted setups.
It includes an admin upload flow, viewer accounts, album browsing, and expiring share links.

## What this project includes

- `server/`: Fastify API, authentication, invites, uploads, and media access control
- `client/`: React SPA for login, gallery browsing, upload UI, and shared views
- `prisma/`: database schema, migrations, and admin seeding script
- `docs/`: deployment, Nginx, security, backup, and API reference notes

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16+
- A writable media directory (for originals and resized images)
- SendGrid API key (required by current invite email flow)

Optional for production:

- Nginx (for SPA hosting + protected media delivery with `X-Accel-Redirect`)
- systemd (if running as a Linux service)
- certbot (HTTPS certificates)

## 1) Clone and install dependencies

```bash
git clone <your-repo-url>
cd photoapp
npm install --prefix server
npm install --prefix client
```

## 2) Configure environment

Copy `.env.example` to `.env` in the project root.

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Required environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | yes | Runtime mode (`development` or `production`) |
| `PORT` | yes | API port (default `3000`) |
| `DATABASE_URL` | yes | Postgres connection string |
| `SESSION_SECRET` | yes | Session-related secret value |
| `SENDGRID_API_KEY` | yes | SendGrid API key for invite emails |
| `EMAIL_FROM` | yes | From-address for invite emails |
| `APP_URL` | yes | Public frontend URL |
| `CORS_ORIGIN` | yes | Allowed frontend origin |
| `COOKIE_SECURE` | yes | `true` behind HTTPS, otherwise `false` in local dev |
| `MEDIA_ROOT` | yes | Absolute or writable path for media files |
| `MAX_UPLOAD_MB` | yes | Max upload size in MB |
| `INVITE_EXPIRES_DAYS` | yes | Default invite expiration |
| `SHARE_EXPIRES_HOURS` | yes | Default share-link expiration |
| `ADMIN_EMAIL` | yes for seed | Seeded admin account email |
| `ADMIN_PASSWORD` | yes for seed | Seeded admin account password |

Local example values:

- `APP_URL=http://localhost:5173`
- `CORS_ORIGIN=http://localhost:5173`
- `MEDIA_ROOT=./media` (or any absolute writable path)
- `COOKIE_SECURE=false`

## 3) Prepare PostgreSQL

Create a database and user, then set `DATABASE_URL`.

Example:

```text
DATABASE_URL=postgresql://photoapp:photoapp@localhost:5432/photoapp
```

## 4) Generate Prisma client, migrate, and seed admin

```bash
npm --prefix server run prisma:generate
npm --prefix server run prisma:migrate
npm --prefix server run seed
```

## 5) Run everything in development

Start API:

```bash
npm --prefix server run dev
```

Start frontend (new terminal):

```bash
npm --prefix client run dev
```

Default URLs:

- API: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- Health check: `http://localhost:3000/health`

## 6) Verify basic flow

1. Open the frontend and log in with seeded admin credentials.
2. Upload a photo from the admin upload page.
3. Confirm the photo appears in the gallery.
4. Create an invite and test invite acceptance.
5. Generate a share link and open it in a private browser window.

## Production notes

- Build commands:

```bash
npm --prefix server run build
npm --prefix client run build
```

- Apply production migrations:

```bash
npm --prefix server run prisma:deploy
```

- See deployment docs:
  - `docs/DEPLOY.md`
  - `docs/NGINX.md`
  - `docs/SECURITY.md`
  - `docs/BACKUP.md`
  - `docs/API.md`

## Troubleshooting

- API fails on startup with env validation errors:
  - Check `.env` keys and formats (email/url values must be valid).
- Upload fails with permission errors:
  - Ensure `MEDIA_ROOT` exists and is writable by the API process.
- Invite emails fail:
  - Verify `SENDGRID_API_KEY`, sender domain setup, and `EMAIL_FROM`.
- CORS/cookie issues in browser:
  - Ensure `APP_URL`, `CORS_ORIGIN`, and `COOKIE_SECURE` match your environment.
