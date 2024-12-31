"use server";
import "server-only";
import { SUCCESS_MESSAGES } from "@/constants";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import type { SignInSchema } from "@/features/auth/schemas/sign-in-schema";
import { signIn as NextAuthSignIn } from "@/features/auth/utils/auth";
import { getLoginUserInfo } from "@/features/auth/utils/header-info";
import { loggerInfo } from "@/pino";
import prisma from "@/prisma";
import type { ServerAction } from "@/types";
import { sendLineNotifyMessage } from "@/utils/fetch-message";

type SignInState = ServerAction<undefined>;

async function createSelfLoginHistory(
	username: string,
	ipAddress: string | undefined,
	userAgent: string | undefined,
) {
	// MEMO: auth()によって制限をかけると動かない
	const user = await prisma.users.findUniqueOrThrow({
		where: { username },
		select: { id: true },
	});

	return await prisma.loginHistories.create({
		data: {
			userId: user.id,
			ipAddress,
			userAgent,
		},
	});
}

export async function signIn(values: SignInSchema): Promise<SignInState> {
	try {
		await NextAuthSignIn("github", {
			...values,
			redirect: false, // MEMO: await try catch文でredirectは動かない
		});
		const { ipAddress, userAgent } = await getLoginUserInfo();
		await createSelfLoginHistory(values.username, ipAddress, userAgent);
		loggerInfo(SUCCESS_MESSAGES.SIGN_IN, {
			caller: "signIn",
			status: 200,
		});
		await sendLineNotifyMessage(SUCCESS_MESSAGES.SIGN_IN);
		return {
			success: true,
			message: SUCCESS_MESSAGES.SIGN_IN,
			data: undefined,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
