import { PrismaClient as UserPrismaClient } from "../../prisma/generated/user";

const userPrismaClientSingleton = () => {
  return new UserPrismaClient();
};

// Declare global types to avoid multiple instances during development
declare global {
  var userPrisma: undefined | ReturnType<typeof userPrismaClientSingleton>;
}

export const userPrisma = globalThis.userPrisma ?? userPrismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.userPrisma = userPrisma;
}
