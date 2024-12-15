"use client";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addNews } from "@/features/news/actions/add-news";
import { useToast } from "@/hooks/use-toast";
import type { Categories } from "@prisma/client";
import { ClipboardPasteIcon } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
	categories: Omit<Categories, "createdAt" | "updatedAt" | "userId">[];
};

const NEW_CATEGORY_VALUE = "new"; // 新規の場合のcategoryのvalue

export function AddNewsForm({ categories }: Props) {
	const titleInputRef = useRef<HTMLInputElement>(null);
	const quoteInputRef = useRef<HTMLTextAreaElement>(null);
	const urlInputRef = useRef<HTMLInputElement>(null);

	const { toast } = useToast();

	const [newCategoryInputOpen, setNewCategoryInputOpen] = useState(false);

	const formAction = async (formData: FormData) => {
		const response = await addNews(formData);
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

	const handleSelectValueChange = (value: string) => {
		setNewCategoryInputOpen(value === NEW_CATEGORY_VALUE);
	};

	const handlePasteClick = async () => {
		const clipboardText = await navigator.clipboard.readText();
		if (urlInputRef.current !== null) urlInputRef.current.value = clipboardText;
	};

	return (
		// MEMO: experimental feature of using form actions
		<form action={formAction} className="space-y-4 px-2 py-4">
			<div className="space-y-1">
				<Label htmlFor="category">カテゴリー</Label>
				<Select
					name="category"
					required
					onValueChange={handleSelectValueChange}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{categories.map((category) => (
							<SelectItem value={String(category.id)} key={category.id}>
								{category.name}
							</SelectItem>
						))}
						<SelectItem value={NEW_CATEGORY_VALUE} key={NEW_CATEGORY_VALUE}>
							その他
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
			{newCategoryInputOpen && (
				<div className="space-y-1">
					<Input
						id="new_category"
						name="new_category"
						required
						autoComplete="off"
					/>
				</div>
			)}
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
						ref={urlInputRef}
						autoComplete="off"
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
