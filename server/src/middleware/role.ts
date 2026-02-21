// Authorization guard for ADMIN-only operations.
import { FastifyReply, FastifyRequest } from "fastify";
import { Role } from "@prisma/client";

export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  // `requireAuth` should run first, but we still guard missing users defensively.
  if (!request.user || request.user.role !== Role.ADMIN) {
    reply.code(403).send({ error: "Forbidden" });
    return;
  }
};
