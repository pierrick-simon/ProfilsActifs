import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      acceptedTerms: {
        type: "boolean",
        required: true,
        input: true,
      },
      localisation: {
        type: "string",
        required: true,
        input: true,
      },
      dateOfBirth: {
        type: "date",
        required: true,
        input: true,
      },
    },
  },
  plugins: [
      admin()
  ]
});
