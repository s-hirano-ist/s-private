import "server-only";
import { env } from "@/env";
import { LineNotifyError } from "@/error-classes";
import { loggerError } from "@/pino";

// MEMO: do not throw error here due to error handling wrapper error loop
export async function sendLineNotifyMessage(message: string) {
	try {
		const LINE_NOTIFY_URL = env.LINE_NOTIFY_URL;
		const LINE_NOTIFY_SECRET_TOKEN = env.LINE_NOTIFY_SECRET_TOKEN;

		const body = new URLSearchParams();
		body.append("message", message);

		const result = await fetch(LINE_NOTIFY_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: `Bearer ${LINE_NOTIFY_SECRET_TOKEN}`,
			},
			body,
		});
		if (result.status !== 200) throw new LineNotifyError();
	} catch (error) {
		if (error instanceof LineNotifyError) {
			loggerError(error.message, {
				caller: "sendLineMessageError",
				status: 500,
			});
		} else {
			loggerError(
				"Send line message failed with unknown error",
				{
					caller: "sendLineMessageUnknownError",
					status: 500,
				},
				error,
			);
		}
	}
}
