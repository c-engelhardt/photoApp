# API reference

Base path: `/api`

## Auth

- `POST /login`
  - Body: `{ "email": "string", "password": "string" }`
  - Response: `{ "id": "uuid", "email": "string", "role": "ADMIN|VIEWER" }`
- `POST /logout`
  - Response: `204`
- `GET /me`
  - Response: `{ "id": "uuid", "email": "string", "role": "ADMIN|VIEWER" }`

## Invites

- `POST /invites` (admin)
  - Body: `{ "email": "string", "expiresAt": "iso8601|null" }`
  - Response: `{ "id": "uuid", "email": "string", "token": "string", "expiresAt": "iso8601" }`
- `POST /invites/accept`
  - Body: `{ "token": "string", "password": "string" }`
  - Response: `{ "id": "uuid", "email": "string" }`

## Photos

- `POST /photos` (admin, multipart)
  - Fields: `file`, `title`, `description`, `tags`, `albumId`, `visibility`
  - Response: `{ "id": "uuid", "title": "string", "createdAt": "iso8601" }`
- `GET /photos`
  - Query: `page`, `limit`, `tag`, `q`, `albumId`
  - Response: `{ "items": [PhotoListItem], "page": 1, "total": 123 }`
- `GET /photos/:id`
  - Response: `PhotoDetail`

## Albums

- `POST /albums` (admin)
  - Body: `{ "title": "string", "description": "string|null" }`
- `GET /albums`
  - Response: `{ "items": [AlbumListItem] }`
- `GET /albums/:id`
  - Response: `AlbumDetail`

## Tags

- `GET /tags`
  - Response: `{ "items": ["tag", "tag2"] }`

## Share links

- `POST /share-links` (admin)
  - Body: `{ "resourceType": "photo|album", "resourceId": "uuid", "expiresAt": "iso8601|null" }`
  - Response: `{ "token": "string", "expiresAt": "iso8601" }`
- `GET /share/:token`
  - Response: `{ "resourceType": "photo|album", "resource": PhotoDetail|AlbumDetail }`
- `GET /share/:token/media/:size/:photoId`
  - Streams media by share token

## Media

- `GET /media/:size/:photoId` (auth required)
  - `size` is one of `320`, `768`, `1280`, `original`

## Data shapes

`PhotoListItem`:
```
{
  "id": "uuid",
  "title": "string",
  "description": "string|null",
  "createdAt": "iso8601",
  "thumbUrl": "string",
  "tags": ["tag"]
}
```

`PhotoDetail`:
```
{
  "id": "uuid",
  "title": "string",
  "description": "string|null",
  "createdAt": "iso8601",
  "width": 0,
  "height": 0,
  "tags": ["tag"],
  "sizes": { "320": "url", "768": "url", "1280": "url", "original": "url" }
}
```

`AlbumDetail`:
```
{
  "id": "uuid",
  "title": "string",
  "description": "string|null",
  "createdAt": "iso8601",
  "photos": [PhotoListItem]
}
```
