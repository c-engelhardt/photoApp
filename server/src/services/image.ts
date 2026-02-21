// Image processing pipeline that writes original and resized variants.
import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";
import { env } from "../config/env.js";
import { IMAGE_SIZES } from "../config/constants.js";

const sizeDir = (size: number) => `size_${size}`;

export const ensureMediaDirs = async () => {
  // Keep directory creation idempotent so uploads can run concurrently.
  const dirs = ["originals", ...IMAGE_SIZES.map(sizeDir)];
  await Promise.all(dirs.map((dir) => fs.mkdir(path.join(env.MEDIA_ROOT, dir), { recursive: true })));
};

export const processImage = async (buffer: Buffer, storageKey: string, ext: string) => {
  await ensureMediaDirs();

  // Auto-rotate based on EXIF orientation before generating derivatives.
  const base = sharp(buffer).rotate();
  const metadata = await base.metadata();

  const encoder = (pipeline: sharp.Sharp) => {
    if (ext === "png") {
      return pipeline.png({ compressionLevel: 9 });
    }
    return pipeline.jpeg({ quality: 82, mozjpeg: true });
  };

  const originalPath = path.join(env.MEDIA_ROOT, "originals", storageKey);
  // Re-encode original to strip metadata and normalize output format settings.
  await encoder(base.clone()).toFile(originalPath);

  // Generate fixed-width variants used by gallery/detail breakpoints.
  const sizeEntries = await Promise.all(
    IMAGE_SIZES.map(async (size) => {
      const filePath = path.join(env.MEDIA_ROOT, sizeDir(size), storageKey);
      await encoder(base.clone().resize({ width: size, withoutEnlargement: true })).toFile(filePath);
      return [size, `${sizeDir(size)}/${storageKey}`] as const;
    })
  );

  const sizes = Object.fromEntries(sizeEntries);

  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    sizes,
    original: `originals/${storageKey}`
  };
};
