"use client";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addContents } from "@/features/contents/actions/add-contents";
import { useToast } from "@/hooks/use-toast";
import { ClipboardPasteIcon } from "lucide-react";
import { useRef } from "react";

export function AddContentsForm() {
	const titleInputRef = useRef<HTMLInputElement>(null);
	const quoteInputRef = useRef<HTMLTextAreaElement>(null);
	const urlInputRef = useRef<HTMLInputElement>(null);

	const { toast } = useToast();

	const formAction = async (formData: FormData) => {
		const response = await addContents(formData);
		if (!response.success) {
			toast({
				variant: "destructive",
				description: response.message,
			});
			return;
		}
		toast({
			variant: "default",
			description: response.message,
		});
		if (titleInputRef.current) titleInputRef.current.value = "";
		if (quoteInputRef.current) quoteInputRef.current.value = "";
		if (urlInputRef.current) urlInputRef.current.value = "";
	};

	const handlePasteClick = async () => {
		const clipboardText = await navigator.clipboard.readText();
		if (urlInputRef.current !== null) urlInputRef.current.value = clipboardText;
	};

	return (
		// MEMO: experimental feature of using form actions
		<form action={formAction} className="space-y-4 px-2 py-4">
			<div className="space-y-1">
				<Label htmlFor="title">タイトル</Label>
				<Input
					id="title"
					name="title"
					ref={titleInputRef}
					autoComplete="off"
					required
				/>
			</div>
			<div className="space-y-1">
				<Label htmlFor="quote">ひとこと</Label>
				<Textarea
					id="quote"
					name="quote"
					ref={quoteInputRef}
					autoComplete="off"
				/>
			</div>
			<div className="space-y-1">
				<Label htmlFor="url">URL</Label>
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
					<Button variant="ghost" type="button" onClick={handlePasteClick}>
						<ClipboardPasteIcon />
					</Button>
				</div>
			</div>
			<SubmitButton label="保存" />
		</form>
	);
}
