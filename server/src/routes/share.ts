// Share-link endpoints for public read access with token-scoped media access.
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { ShareResourceType } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/role.js";
import { shareRateLimit } from "../middleware/rateLimit.js";
import { createShareLink, getShareLink } from "../services/shareLinks.js";
import { INTERNAL_MEDIA_PREFIX } from "../config/constants.js";

const createSchema = z.object({
  resourceType: z.enum(["photo", "album"]),
  resourceId: z.string().uuid(),
  expiresAt: z.string().datetime().optional().nullable()
});

const sizeMap: Record<string, string> = {
  original: "originals",
  "320": "size_320",
  "768": "size_768",
  "1280": "size_1280"
};

const buildShareMediaUrl = (token: string, size: string, photoId: string) =>
  `/api/share/${token}/media/${size}/${photoId}`;

export const shareRoutes = async (app: FastifyInstance) => {
  app.post(
    "/share-links",
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parsed = createSchema.safeParse(request.body);
      if (!parsed.success) {
        reply.code(400).send({ error: "Invalid share payload" });
        return;
      }

      // Public API uses lowercase strings; DB stores enums.
      const resourceType =
        parsed.data.resourceType === "album" ? ShareResourceType.ALBUM : ShareResourceType.PHOTO;
      const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
      const share = await createShareLink(resourceType, parsed.data.resourceId, expiresAt ?? undefined);

      reply.code(201).send({ token: share.token, expiresAt: share.expiresAt });
    }
  );

  app.get(
    "/share/:token",
    { config: { rateLimit: shareRateLimit } },
    async (request, reply) => {
      const { token } = request.params as { token: string };
      const link = await getShareLink(token);
      if (!link) {
        reply.code(404).send({ error: "Invalid or expired share link" });
        return;
      }

      // Response shape differs for photo vs album shares.
      if (link.resourceType === ShareResourceType.PHOTO) {
        const photo = await prisma.photo.findUnique({
          where: { id: link.resourceId },
          include: { tags: { include: { tag: true } } }
        });

        if (!photo) {
          reply.code(404).send({ error: "Not found" });
          return;
        }

        reply.send({
          resourceType: "photo",
          resource: {
            id: photo.id,
            title: photo.title,
            description: photo.description,
            createdAt: photo.createdAt,
            width: photo.width,
            height: photo.height,
            tags: photo.tags.map((tag) => tag.tag.name),
            sizes: {
              "320": buildShareMediaUrl(token, "320", photo.id),
              "768": buildShareMediaUrl(token, "768", photo.id),
              "1280": buildShareMediaUrl(token, "1280", photo.id),
              original: buildShareMediaUrl(token, "original", photo.id)
            }
          }
        });
        return;
      }

      const album = await prisma.album.findUnique({
        where: { id: link.resourceId },
        include: {
          photos: {
            include: { photo: { include: { tags: { include: { tag: true } } } } },
            orderBy: { position: "asc" }
          }
        }
      });

      if (!album) {
        reply.code(404).send({ error: "Not found" });
        return;
      }

      reply.send({
        resourceType: "album",
        resource: {
          id: album.id,
          title: album.title,
          description: album.description,
          createdAt: album.createdAt,
          photos: album.photos.map(({ photo }) => ({
            id: photo.id,
            title: photo.title,
            description: photo.description,
            createdAt: photo.createdAt,
            thumbUrl: buildShareMediaUrl(token, "320", photo.id),
            tags: photo.tags.map((tag) => tag.tag.name)
          }))
        }
      });
    }
  );

  app.get(
    "/share/:token/media/:size/:photoId",
    { config: { rateLimit: shareRateLimit } },
    async (request, reply) => {
      const { token, size, photoId } = request.params as {
        token: string;
        size: string;
        photoId: string;
      };

      const folder = sizeMap[size];
      if (!folder) {
        reply.code(400).send({ error: "Invalid size" });
        return;
      }

      const link = await getShareLink(token);
      if (!link) {
        reply.code(404).send({ error: "Invalid or expired share link" });
        return;
      }

      // Photo links can only access the exact shared photo id.
      if (link.resourceType === ShareResourceType.PHOTO && link.resourceId !== photoId) {
        reply.code(403).send({ error: "Forbidden" });
        return;
      }

      if (link.resourceType === ShareResourceType.ALBUM) {
        // Album links can access only photos that belong to the shared album.
        const inAlbum = await prisma.albumPhoto.findFirst({
          where: { albumId: link.resourceId, photoId }
        });
        if (!inAlbum) {
          reply.code(403).send({ error: "Forbidden" });
          return;
        }
      }

      const photo = await prisma.photo.findUnique({ where: { id: photoId } });
      if (!photo) {
        reply.code(404).send({ error: "Not found" });
        return;
      }

      const ext = photo.storageKey.endsWith(".png") ? "image/png" : "image/jpeg";
      const isOriginal = size === "original";
      reply.header("Content-Type", ext);
      reply.header(
        "Cache-Control",
        isOriginal ? "private, max-age=0" : "public, max-age=31536000, immutable"
      );

      // Delegate file I/O to Nginx after token and scope checks succeed.
      reply.header("X-Accel-Redirect", `${INTERNAL_MEDIA_PREFIX}/${folder}/${photo.storageKey}`);
      reply.code(200).send();
    }
  );
};
