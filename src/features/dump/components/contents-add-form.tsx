"use client";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addContents } from "@/features/dump/actions/add-contents";
import { contentsContext } from "@/features/dump/stores/contents-context";
import { useToast } from "@/hooks/use-toast";
import { ClipboardPasteIcon } from "lucide-react";
import { useRef } from "react";
import { useSetRecoilState } from "recoil";

export function ContentsAddForm() {
	const titleInputRef = useRef<HTMLInputElement>(null);
	const quoteInputRef = useRef<HTMLTextAreaElement>(null);
	const urlInputRef = useRef<HTMLInputElement>(null);

	const { toast } = useToast();

	const setQueuedContents = useSetRecoilState(contentsContext);

	const formAction = async (formData: FormData) => {
		const state = await addContents(formData);
		if (!state.success) {
			toast({
				variant: "destructive",
				description: state.message,
			});
			return;
		}
		setQueuedContents((previousData) => [state.data, ...(previousData ?? [])]);
		toast({
			variant: "default",
			description: state.message,
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
		<form action={formAction} className="space-y-4 p-4">
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