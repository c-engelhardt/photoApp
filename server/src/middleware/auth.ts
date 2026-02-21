// Authentication guard that resolves the session cookie into `request.user`.
import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../db/prisma.js";
import { SESSION_COOKIE_NAME } from "../config/constants.js";

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  // Session tokens are stored in an HTTP-only cookie.
  const token = request.cookies[SESSION_COOKIE_NAME];

  if (!token) {
    reply.code(401).send({ error: "Not authenticated" });
    return;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    // Clean up stale sessions so repeated requests do not keep hitting expired rows.
    if (session) {
      await prisma.session.delete({ where: { token } });
    }
    reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    reply.code(401).send({ error: "Session expired" });
    return;
  }

  // Downstream handlers rely on this payload for role checks and ownership.
  request.user = {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role
  };
};
