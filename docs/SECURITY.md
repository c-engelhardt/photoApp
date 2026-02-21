# Security notes

- Session cookies are HttpOnly and SameSite=Lax.
- `COOKIE_SECURE=true` should be enabled behind HTTPS.
- Login is rate limited to 5/min per IP.
- Invite creation is rate limited to 3/min per admin.
- Share token checks are rate limited to 30/min per IP.
- Share links default to 24 hours unless overridden by admin.
- EXIF metadata is stripped on upload by default.
- Originals are protected via Nginx internal routing and X-Accel-Redirect.
