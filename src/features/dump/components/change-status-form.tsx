"use client";
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
import { changeContentsStatus } from "@/features/contents/actions/change-contents-status";
import { changeImagesStatus } from "@/features/image/actions/change-images-status";
import { changeNewsStatus } from "@/features/news/actions/change-news-status";
import { useActionState, useState } from "react";
import { toast } from "sonner";

export function ChangeStatusForm() {
	const [target, setTarget] = useState<string>();
	const [status, setStatus] = useState<string>();

	const changeStatus = async (_: null, formData: FormData) => {
		const target = formData.get("target");
		const status = formData.get("status");

		if (!target || !status) throw new UnexpectedError();

		const response = await (async () => {
			if (target === "news") {
				if (status === "update") return await changeNewsStatus("UPDATE");
				if (status === "revert") return await changeNewsStatus("REVERT");
				throw new UnexpectedError();
			}
			if (target === "contents") {
				if (status === "update") return await changeContentsStatus("UPDATE");
				if (status === "revert") return await changeContentsStatus("REVERT");
				throw new UnexpectedError();
			}
			if (target === "images") {
				if (status === "update") return await changeImagesStatus("UPDATE");
				if (status === "revert") return await changeImagesStatus("REVERT");
				throw new UnexpectedError();
			}
			throw new UnexpectedError();
		})();

		toast(response.message);

		setTarget("");
		setStatus("");

		return null;
	};

	const [_, submitAction, isPending] = useActionState(changeStatus, null);

	return (
		<form action={submitAction} className="space-y-4 px-2 py-4">
			<div className="space-y-1">
				<Label htmlFor="target">DUMP対象のターゲット</Label>
				<Select
					required
					name="target"
					value={target}
					onValueChange={(value: string) => setTarget(value)}
				>
					<SelectTrigger id="target">
						<SelectValue placeholder="ターゲット" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="news">NEWS</SelectItem>
						<SelectItem value="contents">CONTENTS</SelectItem>
						<SelectItem value="images">IMAGES</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-1">
				<Label htmlFor="status">DUMPの状態</Label>
				<Select
					required
					name="status"
					value={status}
					onValueChange={(value: string) => setStatus(value)}
				>
					<SelectTrigger id="status">
						<SelectValue placeholder="状態" />
					</SelectTrigger>
					<SelectContent id="status">
						<SelectItem value="update">UPDATE</SelectItem>
						<SelectItem value="revert">REVERT</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<Button type="submit" disabled={isPending} className="w-full">
				送信
			</Button>
		</form>
	);
}
