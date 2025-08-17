import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const { signIn, signUp, signOut, useSession, updateUser, changeEmail, changePassword} =
  createAuthClient({
    plugins: [usernameClient()],
    baseURL: process.env.BETTER_AUTH_URL!,
  });