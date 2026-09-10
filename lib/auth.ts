import { betterAuth, APIError } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import {admin as adminPlugin} from "better-auth/plugins";
import {ac, recruiter, candidate, admin} from "./auth/permissions";
import { isAtLeast16 } from "./age-gate";

function assertAdultUser(user: Record<string, unknown>) {
  const dateOfBirth = user.dateOfBirth;
  if (
    dateOfBirth == null ||
    !(dateOfBirth instanceof Date || typeof dateOfBirth === "string") ||
    !isAtLeast16(dateOfBirth)
  ) {
    throw APIError.fromStatus("BAD_REQUEST", {
      message: "Vous devez avoir au moins 16 ans pour vous inscrire.",
    });
  }
}

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
      certification: {
        type: "date",
        required: false,
        input: true,
      },
      activitySector: {
        type: "string",
        required: false,
        input: true,
      },
      showProfile: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          assertAdultUser(user);
        },
      },
      update: {
        async before(user) {
          if (user.dateOfBirth !== undefined) {
            assertAdultUser(user);
          }
        },
      },
    },
  },
  plugins: [
      adminPlugin({
          ac,
          roles: {recruiter, candidate, admin}
      })
  ]
});
