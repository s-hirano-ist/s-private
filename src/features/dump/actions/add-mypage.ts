"use server";
import { sendLineNotifyMessage } from "@/apis/line-notify/send-message";
import { createMypage } from "@/apis/prisma/fetch-mypage";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants";
import { auth } from "@/features/auth/lib/auth";
import type { MypageContext } from "@/features/dump/stores/mypage-context";
import { validateMypage } from "@/features/dump/utils/validate-mypage";
import { formatCreateContentMessage } from "@/lib/format-for-line";
import type { ServerAction } from "@/types/server-action";

type AddMypageState =
	| (ServerAction & { success: true; data: MypageContext })
	| (ServerAction & { success: false });

export async function addMypage(formData: FormData): Promise<AddMypageState> {
	try {
		const authorized = await auth();
		if (!authorized) throw new Error("Unauthorized");

		const mypageValidatedFields = validateMypage(formData);
		const newMypage = await createMypage(mypageValidatedFields);
		await sendLineNotifyMessage(
			formatCreateContentMessage(
				newMypage.title,
				newMypage.quote ?? "",
				newMypage.url,
				"MYPAGE",
			),
		);

		return {
			success: true,
			message: SUCCESS_MESSAGES.INSERT,
			data: {
				id: newMypage.id,
				title: mypageValidatedFields.data.title,
				quote: mypageValidatedFields.data.quote,
				url: mypageValidatedFields.data.url,
			},
		};
	} catch (error) {
		if (error instanceof Error) {
			console.error(error.message);
			await sendLineNotifyMessage(error.message);
			return {
				success: false,
				message: error.message,
			};
		}
		console.error("Unexpected error:", error);
		await sendLineNotifyMessage(ERROR_MESSAGES.UNEXPECTED);
		return {
			success: false,
			message: ERROR_MESSAGES.UNEXPECTED,
		};
	}
}
