import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

const run = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash, role: Role.ADMIN }
    });
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: Role.ADMIN
    }
  });
};

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
