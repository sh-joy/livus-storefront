import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendVerificationEmail } from "./email";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "livus-super-secret-auth-key-2026-production",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  errorURL: "/signin",
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      try {
        await sendVerificationEmail({
          to: user.email,
          userName: user.name,
          verificationUrl: url,
        });
      } catch (err) {
        console.warn("Non-fatal email verification warning:", err);
      }
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    } : {}),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? {
      facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        scope: ["public_profile"],
        fields: ["id", "name", "picture"],
        mapProfileToUser(profile: any) {
          return {
            name: profile.name || "Facebook User",
            email: profile.email || `${profile.id}@facebook.com`,
            image: profile.picture?.data?.url || profile.picture || null,
          };
        },
      },
    } : {}),
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET ? {
      apple: {
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET,
      },
    } : {}),
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
    },
  },
});
