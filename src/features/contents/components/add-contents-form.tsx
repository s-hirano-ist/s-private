"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addContents } from "@/features/contents/actions/add-contents";
import { AddFormSkeleton } from "@/features/dump/components/add-form-skeleton";
import { ClipboardPasteIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useRef } from "react";
import { toast } from "sonner";

export function AddContentsForm() {
	const urlInputRef = useRef<HTMLInputElement>(null);

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
		if (urlInputRef.current !== null) urlInputRef.current.value = clipboardText;
	};

	return (
		<form action={addContentsAction} className="space-y-4 px-2 py-4">
			{isPending ? (
				<AddFormSkeleton />
			) : (
				<>
					<div className="space-y-1">
						<Label htmlFor="title">{label("title")}</Label>
						<Input id="title" name="title" autoComplete="off" required />
					</div>
					<div className="space-y-1">
						<Label htmlFor="quote">{label("description")}</Label>
						<Textarea id="quote" name="quote" autoComplete="off" />
					</div>
					<div className="space-y-1">
						<Label htmlFor="url">{label("url")}</Label>
						<div className="flex space-x-2 px-2">
							<Input
								id="url"
								name="url"
								type="url"
								inputMode="url"
								autoComplete="off"
								ref={urlInputRef}
								required
							/>
							<Button
								variant="ghost"
								type="button"
								onClick={handlePasteClick}
								data-testid="paste-button"
							>
								<ClipboardPasteIcon />
							</Button>
						</div>
					</div>
				</>
			)}
			<Button type="submit" disabled={isPending} className="w-full">
				{label("save")}
			</Button>
		</form>
	);
}
