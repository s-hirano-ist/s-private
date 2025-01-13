"use server";
import "server-only";
import { SUCCESS_MESSAGES } from "@/constants";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { signOut as NextAuthSignOut } from "@/features/auth/utils/auth";
import { loggerInfo } from "@/pino";
import type { ServerAction } from "@/types";
import { sendLineNotifyMessage } from "@/utils/fetch-message";

type SignOutState = ServerAction<undefined>;

// FIXME: not used now

export async function signOut(): Promise<SignOutState> {
	try {
		await NextAuthSignOut({
			redirect: false, // MEMO: await try catch文でredirectは動かない
		});
		loggerInfo(SUCCESS_MESSAGES.SIGN_OUT, {
			caller: "signOut",
			status: 200,
		});
		await sendLineNotifyMessage(SUCCESS_MESSAGES.SIGN_OUT);
		return {
			success: true,
			message: SUCCESS_MESSAGES.SIGN_OUT,
			data: undefined,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
