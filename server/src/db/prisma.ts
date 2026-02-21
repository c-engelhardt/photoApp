// Process-wide Prisma client instance reused across handlers.
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
