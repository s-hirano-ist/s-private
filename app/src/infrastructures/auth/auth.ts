import "server-only";
import { env } from "@/env";
import prisma from "@/prisma";
import { createBackendAuth } from "@s-hirano-ist/s-backend/auth/web-auth";
export const { auth, isLocalDevAuthEnabled } = createBackendAuth(env, prisma);
