import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";

import { env } from "~/env";
import { db } from "~/server/db";

export const auth = betterAuth({
  appName: "RepoDock",
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    maxPasswordLength: 128,
    minPasswordLength: 8,
  },
  secret: env.BETTER_AUTH_SECRET,
});
