"use client";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddFormSkeleton } from "@/features/dump/components/add-form-skeleton";
import { addNews } from "@/features/news/actions/add-news";
import { ClipboardPasteIcon, TableOfContentsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useRef } from "react";
import { toast } from "sonner";

type Props = { categories: { name: string; id: number }[] };

export function AddNewsForm({ categories }: Props) {
	const urlInputRef = useRef<HTMLInputElement>(null);
	const categoryInputRef = useRef<HTMLInputElement>(null);

	const label = useTranslations("label");
	const message = useTranslations("message");

	const submitForm = async (_: null, formData: FormData) => {
		const response = await addNews(formData);
		toast(message(response.message));
		return null;
	};

	const [_, addNewsAction, isPending] = useActionState(submitForm, null);

	const handleSelectedValueChange = (value: string) => {
		if (categoryInputRef.current !== null)
			categoryInputRef.current.value = value;
	};

	const handlePasteClick = async () => {
		const clipboardText = await navigator.clipboard.readText();
		if (urlInputRef.current !== null) urlInputRef.current.value = clipboardText;
	};

	return (
		<form action={addNewsAction} className="space-y-4 px-2 py-4">
			{isPending ? (
				<AddFormSkeleton showCategory />
			) : (
				<>
					<div className="space-y-1">
						<Label htmlFor="category">{label("category")}</Label>
						<div className="flex">
							<Input
								id="category"
								name="category"
								required
								autoComplete="off"
								ref={categoryInputRef}
							/>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost">
										<TableOfContentsIcon />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									{categories.map((category) => (
										<DropdownMenuItem
											onClick={() => handleSelectedValueChange(category.name)}
											textValue={String(category.name)}
											key={category.id}
										>
											{category.name}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
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
						<div className="flex">
							<Input
								id="url"
								name="url"
								type="url"
								inputMode="url"
								autoComplete="off"
								required
								ref={urlInputRef}
							/>
							<Button variant="ghost" type="button" onClick={handlePasteClick}>
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
