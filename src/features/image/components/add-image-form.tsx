"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addImage } from "@/features/image/actions/add-image";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { toast } from "sonner";

export function AddImageForm() {
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
					id="files"
					type="file"
					name="files"
					accept="image/*"
					multiple
					required
				/>
			</div>
			<Button type="submit" disabled={isPending} className="w-full">
				{isPending ? label("uploading") : label("upload")}
			</Button>
		</form>
	);
}
