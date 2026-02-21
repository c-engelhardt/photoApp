// Invite management endpoints for admins and invite redemption for viewers.
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { env } from "../config/env.js";
import { SESSION_COOKIE_NAME, SESSION_EXPIRES_DAYS } from "../config/constants.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/role.js";
import { inviteRateLimit } from "../middleware/rateLimit.js";
import { createInvite, acceptInvite } from "../services/invites.js";
import { generateToken } from "../utils/crypto.js";

const createInviteSchema = z.object({
  email: z.string().email(),
  expiresAt: z.string().datetime().optional().nullable()
});

const acceptSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6)
});

const createSession = async (userId: string) => {
  // Mirrors auth login behavior so accepted invites immediately become signed in.
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return { token, expiresAt };
};

export const inviteRoutes = async (app: FastifyInstance) => {
  app.post(
    "/invites",
    {
      preHandler: [requireAuth, requireAdmin],
      config: { rateLimit: inviteRateLimit }
    },
    async (request, reply) => {
      const parsed = createInviteSchema.safeParse(request.body);
      if (!parsed.success) {
        reply.code(400).send({ error: "Invalid invite payload" });
        return;
      }

      const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined;
      const invite = await createInvite(parsed.data.email, request.user!.id, expiresAt);

      reply.code(201).send({
        id: invite.id,
        email: invite.email,
        // Returning token helps admin tooling/debugging without querying the DB.
        token: invite.token,
        expiresAt: invite.expiresAt
      });
    }
  );

  app.post("/invites/accept", async (request, reply) => {
    const parsed = acceptSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: "Invalid invite payload" });
      return;
    }

    try {
      const user = await acceptInvite(parsed.data.token, parsed.data.password);
      const session = await createSession(user.id);
      // Invite redemption ends with an authenticated browser session.
      reply.setCookie(SESSION_COOKIE_NAME, session.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.COOKIE_SECURE,
        path: "/",
        maxAge: SESSION_EXPIRES_DAYS * 24 * 60 * 60
      });

      reply.code(201).send({ id: user.id, email: user.email });
    } catch (error) {
      reply.code(400).send({ error: (error as Error).message });
    }
  });
};
