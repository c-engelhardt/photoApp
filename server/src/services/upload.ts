// Persists uploaded photos, derived metadata, tags, and optional album placement.
import path from "path";
import { randomUUID } from "crypto";
import { Visibility } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { processImage } from "./image.js";
import { generateToken } from "../utils/crypto.js";
import { slugify } from "../utils/slug.js";

const mimeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png"
};

export type UploadInput = {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  title?: string;
  description?: string | null;
  tags?: string[];
  albumId?: string | null;
  visibility?: Visibility;
};

export const uploadPhoto = async (input: UploadInput) => {
  const ext = mimeToExt[input.mimetype];
  if (!ext) {
    throw new Error("Unsupported file type");
  }

  const id = randomUUID();
  const storageKey = `${id}.${ext}`;
  // Fall back to the uploaded filename when no explicit title is provided.
  const fallbackTitle = path.parse(input.filename).name || "photo";
  const rawTitle = input.title?.trim();
  const title = rawTitle && rawTitle.length > 0 ? rawTitle : fallbackTitle;
  // Add entropy so similar titles do not collide on unique slugs.
  const slugBase = slugify(title) || "photo";
  const slug = `${slugBase}-${generateToken(3)}`;

  const processed = await processImage(input.buffer, storageKey, ext);

  // Normalize to lowercase and collapse duplicates before writing relations.
  const tags = (input.tags || [])
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);

  const uniqueTags = Array.from(new Set(tags));

  // Reuse existing tags when available and create missing ones on demand.
  const tagCreates = uniqueTags.map((name) => ({
    tag: {
      connectOrCreate: {
        where: { name },
        create: { name }
      }
    }
  }));

  const albumPhotoData = input.albumId
    ? {
        // Append to the end of the selected album's ordering.
        albumId: input.albumId,
        position: (await prisma.albumPhoto.count({ where: { albumId: input.albumId } })) + 1
      }
    : null;

  const photo = await prisma.photo.create({
    data: {
      id,
      title,
      description: input.description ?? null,
      slug,
      visibility: input.visibility ?? Visibility.PRIVATE,
      width: processed.width,
      height: processed.height,
      storageKey,
      // Keep relative media paths grouped with generated size variants.
      sizesJson: {
        ...processed.sizes,
        original: processed.original
      },
      tags: tagCreates.length ? { create: tagCreates } : undefined,
      albums: albumPhotoData ? { create: albumPhotoData } : undefined
    }
  });

  return photo;
};
