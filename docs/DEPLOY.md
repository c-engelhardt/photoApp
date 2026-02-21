# Deployment guide

## Server prerequisites

- Node.js 20+
- PostgreSQL 16+
- Nginx
- certbot (for HTTPS)

## Setup

1) Create directories:
   - `/srv/photoapp`
   - `/srv/photoapp/media`
   - `/srv/photoapp/backups`
2) Copy project files into `/srv/photoapp/app`.
3) Configure `.env` in `/srv/photoapp/app`.

## Install dependencies

- `npm install --prefix server`
- `npm install --prefix client`

## Build and migrate

- `npm --prefix server run prisma:generate`
- `npm --prefix server run prisma:deploy`
- `npm --prefix server run seed`
- `npm --prefix server run build`
- `npm --prefix client run build`

## Systemd service

Create `/etc/systemd/system/photoapp.service`:

```
[Unit]
Description=PhotoApp API
After=network.target

[Service]
Type=simple
User=photoapp
WorkingDirectory=/srv/photoapp/app/server
EnvironmentFile=/srv/photoapp/app/.env
ExecStart=/usr/bin/node /srv/photoapp/app/server/dist/app.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:

- `systemctl daemon-reload`
- `systemctl enable photoapp`
- `systemctl start photoapp`

## Nginx and SSL

See `docs/NGINX.md` for the site configuration. Use certbot to create HTTPS certificates.
