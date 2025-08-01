"use client";
import { ClipboardPasteIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addContents } from "@/features/contents/actions/add-contents";
import { AddFormSkeleton } from "@/features/dump/components/add-form-skeleton";

export function AddContentsFormClient() {
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
					<div className="space-y-1">
						<Label htmlFor="title">{label("title")}</Label>
						<Input autoComplete="off" id="title" name="title" required />
					</div>
					<div className="space-y-1">
						<Label htmlFor="quote">{label("description")}</Label>
						<Textarea autoComplete="off" id="quote" name="quote" />
					</div>
					<div className="space-y-1">
						<Label htmlFor="url">{label("url")}</Label>
						<div className="flex space-x-2 px-2">
							<Input
								autoComplete="off"
								id="url"
								inputMode="url"
								name="url"
								ref={urlInputReference}
								required
								type="url"
							/>
							<Button
								data-testid="paste-button"
								onClick={handlePasteClick}
								type="button"
								variant="ghost"
							>
								<ClipboardPasteIcon />
							</Button>
						</div>
					</div>
				</>
			)}
			<Button className="w-full" disabled={isPending} type="submit">
				{label("save")}
			</Button>
		</form>
	);
}
