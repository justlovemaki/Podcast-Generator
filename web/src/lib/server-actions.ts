'use server'

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const getSessionData = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    return {
        session,
        user: session?.user,
        token: session?.session.token,
    }
};