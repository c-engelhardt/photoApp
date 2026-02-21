// Invite lifecycle: create pending invites and redeem them into accounts.
import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma.js";
import { env } from "../config/env.js";
import { generateToken } from "../utils/crypto.js";
import { sendInviteEmail } from "./email.js";

export const createInvite = async (email: string, createdBy: string, expiresAt?: Date) => {
  const token = generateToken(24);
  // Default expiry keeps stale invites from lingering indefinitely.
  const expireDate = expiresAt ?? new Date(Date.now() + env.INVITE_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  const invite = await prisma.invite.create({
    data: {
      email,
      token,
      expiresAt: expireDate,
      createdBy
    }
  });

  // Email send is part of invite creation so callers do not forget notification.
  await sendInviteEmail(email, token);
  return invite;
};

export const acceptInvite = async (token: string, password: string) => {
  const invite = await prisma.invite.findUnique({ where: { token } });

  // A token can only be redeemed once and only before expiration.
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    throw new Error("Invalid or expired invite");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: invite.email,
      passwordHash
    }
  });

  await prisma.invite.update({
    where: { id: invite.id },
    // Mark redeemed so the same link cannot be reused.
    data: { usedAt: new Date() }
  });

  return user;
};
