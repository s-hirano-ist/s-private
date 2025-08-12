"use client";
import { useTranslations } from "next-intl";
import { useActionState, useRef } from "react";
import { toast } from "sonner";
import { AddFormSkeleton } from "@/components/add-form-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
	addContents: (formData: FormData) => Promise<{ message: string }>;
};

export function AddContentsFormClient({ addContents }: Props) {
	const label = useTranslations("label");
	const message = useTranslations("message");

	const submitForm = async (_: null, formData: FormData) => {
		const response = await addContents(formData);
		toast(message(response.message));
		return null;
	};

	const [_, addContentsAction, isPending] = useActionState(submitForm, null);

	return (
		<form action={addContentsAction} className="space-y-4 px-2 py-4">
			{isPending ? (
				<AddFormSkeleton />
			) : (
				<>
					<div className="space-y-1">
						<Label htmlFor="title">{label("title")}</Label>
						<Input autoComplete="off" id="title" name="title" required />
					</div>
					<div className="space-y-1">
						<Label htmlFor="markdown">{label("markdown")}</Label>
						<Textarea autoComplete="off" id="markdown" name="markdown" />
					</div>
				</>
			)}
			<Button className="w-full" disabled={isPending} type="submit">
				{label("save")}
			</Button>
		</form>
	);
}
