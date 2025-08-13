"use client";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
	addImage: (formData: FormData) => Promise<{ message: string }>;
};

export function AddImageFormClient({ addImage }: Props) {
	const label = useTranslations("label");
	const message = useTranslations("message");

	async function submitForm(_: null, formData: FormData) {
		const files = formData.getAll("files");

		for (const file of files) {
			const individualFormData = new FormData();
			individualFormData.append("file", file);

			const response = await addImage(individualFormData);
			toast(message(response.message));
		}
		return null;
	}

	const [_, addNewsAction, isPending] = useActionState(submitForm, null);

	return (
		<form action={addNewsAction} className="space-y-4 px-2 py-4">
			<div className="space-y-1">
				<Label htmlFor="files">{label("image")}</Label>
				<Input
					accept="image/*"
					id="files"
					multiple
					name="files"
					required
					type="file"
				/>
			</div>
			<Button className="w-full" disabled={isPending} type="submit">
				{isPending ? label("uploading") : label("upload")}
			</Button>
		</form>
	);
}
