"use client";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { UnexpectedError } from "@/error-classes";
import { UpdateOrRevert } from "@/features/dump/types";

type Props = {
	changeNewsStatus: (status: UpdateOrRevert) => Promise<{ message: string }>;
	changeContentsStatus: (
		status: UpdateOrRevert,
	) => Promise<{ message: string }>;
	changeImagesStatus: (status: UpdateOrRevert) => Promise<{ message: string }>;
};

export function ChangeStatusFormClient({
	changeNewsStatus,
	changeContentsStatus,
	changeImagesStatus,
}: Props) {
	const [target, setTarget] = useState<string>();
	const [status, setStatus] = useState<string>();
	const label = useTranslations("label");
	const message = useTranslations("message");

	const changeStatus = async (_: null, formData: FormData) => {
		const target = formData.get("target");
		const status = formData.get("status");

		const response = await (async () => {
			if (target === "news") {
				if (status === "update") return await changeNewsStatus("UPDATE");
				if (status === "revert") return await changeNewsStatus("REVERT");
			}
			if (target === "contents") {
				if (status === "update") return await changeContentsStatus("UPDATE");
				if (status === "revert") return await changeContentsStatus("REVERT");
			}
			if (target === "images") {
				if (status === "update") return await changeImagesStatus("UPDATE");
				if (status === "revert") return await changeImagesStatus("REVERT");
			}
			throw new UnexpectedError();
		})();

		toast(message(response.message));

		setTarget("news");
		setStatus("update");

		return null;
	};

	const [_, submitAction, isPending] = useActionState(changeStatus, null);

	return (
		<form action={submitAction} className="space-y-4 px-2 py-4">
			<div className="space-y-1">
				<Label htmlFor="target">{label("dumpTarget")}</Label>
				<Select
					name="target"
					onValueChange={(value: string) => setTarget(value)}
					required
					value={target}
				>
					<SelectTrigger id="target">
						<SelectValue placeholder={label("target")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="news">NEWS</SelectItem>
						<SelectItem value="contents">CONTENTS</SelectItem>
						<SelectItem value="images">IMAGES</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-1">
				<Label htmlFor="status">{label("dumpStatus")}</Label>
				<Select
					name="status"
					onValueChange={(value: string) => setStatus(value)}
					required
					value={status}
				>
					<SelectTrigger id="status">
						<SelectValue placeholder={label("status")} />
					</SelectTrigger>
					<SelectContent id="status">
						<SelectItem value="update">UPDATE</SelectItem>
						<SelectItem value="revert">REVERT</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<Button className="w-full" disabled={isPending} type="submit">
				{label("send")}
			</Button>
		</form>
	);
}
