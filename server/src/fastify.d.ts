// Extends Fastify request typing with the authenticated user payload.
import { Role } from "@prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: Role;
    };
  }
}
