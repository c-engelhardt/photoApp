// Tag lookup endpoint used to power gallery filters.
import { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const tagRoutes = async (app: FastifyInstance) => {
  app.get("/tags", { preHandler: [requireAuth] }, async () => {
    // Alphabetical ordering keeps the filter UI stable between refreshes.
    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
    return { items: tags.map((tag) => tag.name) };
  });
};
