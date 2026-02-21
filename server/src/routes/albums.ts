// Album CRUD-lite endpoints used for gallery grouping and detail views.
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/role.js";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable()
});

// Keep media URL generation consistent with photo endpoints.
const buildMediaUrl = (size: string, photoId: string) => `/api/media/${size}/${photoId}`;

export const albumRoutes = async (app: FastifyInstance) => {
  app.post("/albums", { preHandler: [requireAuth, requireAdmin] }, async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: "Invalid album payload" });
      return;
    }

    const album = await prisma.album.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null
      }
    });

    reply.code(201).send(album);
  });

  app.get("/albums", { preHandler: [requireAuth] }, async () => {
    const albums = await prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        photos: {
          include: { photo: true },
          // First photo by position acts as album cover in gallery cards.
          orderBy: { position: "asc" },
          take: 1
        }
      }
    });

    return {
      items: albums.map((album) => {
        const cover = album.photos[0]?.photo;
        return {
          id: album.id,
          title: album.title,
          description: album.description,
          createdAt: album.createdAt,
          coverPhotoId: cover?.id ?? null,
          coverUrl: cover ? buildMediaUrl("320", cover.id) : null
        };
      })
    };
  });

  app.get("/albums/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        // Include photo tags so clients can render the same chips as global gallery.
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
      id: album.id,
      title: album.title,
      description: album.description,
      createdAt: album.createdAt,
      photos: album.photos.map(({ photo }) => ({
        id: photo.id,
        title: photo.title,
        description: photo.description,
        createdAt: photo.createdAt,
        thumbUrl: buildMediaUrl("320", photo.id),
        tags: photo.tags.map((tag) => tag.tag.name)
      }))
    });
  });
};
