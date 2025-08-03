import "server-only";
import { env } from "@/env";
import { PushoverError } from "@/error-classes";
import { loggerError } from "@/pino";

// MEMO: do not throw error here due to error handling wrapper error loop
export async function sendPushoverMessage(message: string) {
	try {
		const PUSHOVER_API_URL = env.PUSHOVER_URL;
		const PUSHOVER_USER_KEY = env.PUSHOVER_USER_KEY;
		const PUSHOVER_APP_TOKEN = env.PUSHOVER_APP_TOKEN;

		const body = new URLSearchParams({
			token: PUSHOVER_APP_TOKEN,
			user: PUSHOVER_USER_KEY,
			message,
		});

		const result = await fetch(PUSHOVER_API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body,
		});

		if (!result.ok) throw new PushoverError();
	} catch (error) {
		if (error instanceof PushoverError) {
			loggerError(error.message, {
				caller: "sendPushoverMessageError",
				status: 500,
			});
		} else {
			loggerError(
				"Send Pushover message failed with unknown error",
				{
					caller: "sendPushoverMessageUnknownError",
					status: 500,
				},
				error,
			);
		}
	}
}
