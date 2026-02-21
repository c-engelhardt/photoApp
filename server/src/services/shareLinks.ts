// Share link persistence and expiry checks.
import { ShareResourceType } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { env } from "../config/env.js";
import { generateToken } from "../utils/crypto.js";

export const createShareLink = async (
  resourceType: ShareResourceType,
  resourceId: string,
  expiresAt?: Date | null
) => {
  const token = generateToken(20);
  // Use a sensible default expiry when callers do not provide one.
  const expireDate = expiresAt ?? new Date(Date.now() + env.SHARE_EXPIRES_HOURS * 60 * 60 * 1000);

  return prisma.shareLink.create({
    data: {
      token,
      resourceType,
      resourceId,
      expiresAt: expireDate
    }
  });
};

export const getShareLink = async (token: string) => {
  const link = await prisma.shareLink.findUnique({ where: { token } });
  // Expired links behave like missing links to avoid leaking token validity.
  if (!link || link.expiresAt < new Date()) {
    return null;
  }
  return link;
};
