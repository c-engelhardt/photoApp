// Photo upload, listing, detail, and authenticated media delivery endpoints.
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { Visibility, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/role.js";
import { uploadPhoto } from "../services/upload.js";
import { INTERNAL_MEDIA_PREFIX } from "../config/constants.js";

const listSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().min(1).max(100).default(24),
  tag: z.string().optional(),
  q: z.string().optional(),
  albumId: z.string().optional()
});

const sizeMap: Record<string, string> = {
  original: "originals",
  "320": "size_320",
  "768": "size_768",
  "1280": "size_1280"
};

// Frontend consumes stable API URLs instead of internal storage keys.
const buildMediaUrl = (size: string, photoId: string) => `/api/media/${size}/${photoId}`;

const parseTags = (value?: string | string[]) => {
  if (!value) return [];
  // Accept both repeated form fields and comma-delimited values.
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((tag) => tag.split(",")).map((tag) => tag.trim()).filter(Boolean);
};

export const photoRoutes = async (app: FastifyInstance) => {
  app.post(
    "/photos",
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parts = request.parts();
      const fields: Record<string, string[]> = {};
      type FilePart = { filename: string; mimetype: string; toBuffer: () => Promise<Buffer> };
      let filePart: FilePart | null = null;

      // Multipart streams are consumed once, so collect file + fields in a single pass.
      for await (const part of parts) {
        if (part.type === "file") {
          // The endpoint expects one file; if multiple are sent, the last one wins.
          filePart = part;
        } else {
          fields[part.fieldname] ??= [];
          fields[part.fieldname].push(part.value);
        }
      }

      if (!filePart) {
        reply.code(400).send({ error: "File is required" });
        return;
      }

      const buffer = await filePart.toBuffer();
      const title = fields.title?.[0];
      const description = fields.description?.[0];
      const visibilityInput = fields.visibility?.[0]?.toUpperCase();
      const visibility = visibilityInput === "SHARED" ? Visibility.SHARED : Visibility.PRIVATE;
      const albumId = fields.albumId?.[0];
      const tags = parseTags(fields.tags);

      try {
        // Heavy image work and relational writes are delegated to the upload service.
        const photo = await uploadPhoto({
          buffer,
          filename: filePart.filename,
          mimetype: filePart.mimetype,
          title,
          description,
          tags,
          albumId,
          visibility
        });

        reply.code(201).send({
          id: photo.id,
          title: photo.title,
          createdAt: photo.createdAt
        });
      } catch (error) {
        reply.code(400).send({ error: (error as Error).message });
      }
    }
  );

  app.get("/photos", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = listSchema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: "Invalid query" });
      return;
    }

    const { page, limit, tag, q, albumId } = parsed.data;
    const skip = (page - 1) * limit;

    // Build filters incrementally so each query parameter stays optional.
    const where: Prisma.PhotoWhereInput = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } }
      ];
    }
    if (tag) {
      where.tags = { some: { tag: { name: tag.toLowerCase() } } };
    }
    if (albumId) {
      where.albums = { some: { albumId } };
    }

    // Fetch page data and total count together for a consistent response.
    const [items, total] = await prisma.$transaction([
      prisma.photo.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { tags: { include: { tag: true } } }
      }),
      prisma.photo.count({ where })
    ]);

    reply.send({
      page,
      total,
      items: items.map((photo) => ({
        id: photo.id,
        title: photo.title,
        description: photo.description,
        createdAt: photo.createdAt,
        thumbUrl: buildMediaUrl("320", photo.id),
        tags: photo.tags.map((tag) => tag.tag.name)
      }))
    });
  });

  app.get("/photos/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const photo = await prisma.photo.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } }
    });

    if (!photo) {
      reply.code(404).send({ error: "Not found" });
      return;
    }

    reply.send({
      id: photo.id,
      title: photo.title,
      description: photo.description,
      createdAt: photo.createdAt,
      width: photo.width,
      height: photo.height,
      tags: photo.tags.map((tag) => tag.tag.name),
      sizes: {
        "320": buildMediaUrl("320", photo.id),
        "768": buildMediaUrl("768", photo.id),
        "1280": buildMediaUrl("1280", photo.id),
        original: buildMediaUrl("original", photo.id)
      }
    });
  });

  app.get("/media/:size/:photoId", { preHandler: [requireAuth] }, async (request, reply) => {
    const { size, photoId } = request.params as { size: string; photoId: string };
    const folder = sizeMap[size];
    if (!folder) {
      reply.code(400).send({ error: "Invalid size" });
      return;
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

    // Nginx serves the actual file from an internal path after auth passes here.
    reply.header("X-Accel-Redirect", `${INTERNAL_MEDIA_PREFIX}/${folder}/${photo.storageKey}`);
    reply.code(200).send();
  });
};
