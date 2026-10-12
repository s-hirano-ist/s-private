import { seedLocalDevelopmentSampleData } from "@/application-services/local-development/seed-sample-data";
import { env } from "@/env";
import { auth, isLocalDevAuthEnabled } from "@/infrastructures/auth/auth";
import prisma from "@/prisma";
import { createSignInHandler } from "@s-hirano-ist/s-backend/auth/sign-in";

export const GET = createSignInHandler(env, {
	auth,
	isLocalDevAuthEnabled,
	findUser: (email) =>
		prisma.user.findUnique({ where: { email }, select: { id: true } }),
	seedLocalUser: seedLocalDevelopmentSampleData,
});
