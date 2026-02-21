# Nginx config outline

Example site file:

```
server {
  listen 80;
  server_name yourdomain.com;

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    root /srv/photoapp/app/client/dist;
    try_files $uri /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /internal/media/ {
    internal;
    alias /srv/photoapp/media/;
  }
}
```

Notes:

- `X-Accel-Redirect` responses from the API should point to `/internal/media/...`.
- Resize folders live under `/srv/photoapp/media/size_320`, `size_768`, `size_1280`.
- For HTTPS, add a TLS server block and enable HSTS.
