"use client";
import { ClipboardPasteIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useRef } from "react";
import { toast } from "sonner";
import {
	ActionButton,
	FormField,
	InputField,
	InputWithButton,
	TextareaField,
} from "@/components/composition/form-field";
import { addContents } from "@/features/contents/actions/add-contents";
import { AddFormSkeleton } from "@/features/dump/components/add-form-skeleton";

export function AddContentsForm() {
	const urlInputReference = useRef<HTMLInputElement>(null);

	const label = useTranslations("label");
	const message = useTranslations("message");

	const submitForm = async (_: null, formData: FormData) => {
		const response = await addContents(formData);
		toast(message(response.message));
		return null;
	};

	const [_, addContentsAction, isPending] = useActionState(submitForm, null);

	const handlePasteClick = async () => {
		const clipboardText = await navigator.clipboard.readText();
		if (urlInputReference.current !== null)
			urlInputReference.current.value = clipboardText;
	};

	return (
		<form action={addContentsAction} className="space-y-4 px-2 py-4">
			{isPending ? (
				<AddFormSkeleton />
			) : (
				<>
					<FormField htmlFor="title" label={label("title")} required>
						<InputField name="title" required />
					</FormField>

					<FormField htmlFor="quote" label={label("description")}>
						<TextareaField name="quote" />
					</FormField>

					<FormField htmlFor="url" label={label("url")} required>
						<InputWithButton
							buttonText={<ClipboardPasteIcon />}
							inputProps={{
								name: "url",
								type: "url",
								inputMode: "url",
								required: true,
							}}
							inputRef={urlInputReference}
							onButtonClick={handlePasteClick}
						/>
					</FormField>
				</>
			)}
			<ActionButton disabled={isPending}>{label("save")}</ActionButton>
		</form>
	);
}
