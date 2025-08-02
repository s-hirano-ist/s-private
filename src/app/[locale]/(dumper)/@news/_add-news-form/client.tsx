"use client";
import { ClipboardPasteIcon, TableOfContentsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useRef } from "react";
import { toast } from "sonner";
import { AddFormSkeleton } from "@/components/add-form-skeleton";
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

type Props = {
	categories: { id: number; name: string }[];
	addNews: (formData: FormData) => Promise<{ message: string }>;
};

export function AddNewsFormClient({ categories, addNews }: Props) {
	const urlInputReference = useRef<HTMLInputElement>(null);
	const categoryInputReference = useRef<HTMLInputElement>(null);

	const label = useTranslations("label");
	const message = useTranslations("message");

	const submitForm = async (_: null, formData: FormData) => {
		const response = await addNews(formData);
		toast(message(response.message));
		return null;
	};

	const [_, addNewsAction, isPending] = useActionState(submitForm, null);

	const handleSelectedValueChange = (value: string) => {
		if (categoryInputReference.current !== null)
			categoryInputReference.current.value = value;
	};

	const handlePasteClick = async () => {
		const clipboardText = await navigator.clipboard.readText();
		if (urlInputReference.current !== null)
			urlInputReference.current.value = clipboardText;
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
								autoComplete="off"
								id="category"
								name="category"
								ref={categoryInputReference}
								required
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
											key={category.id}
											onClick={() => handleSelectedValueChange(category.name)}
											textValue={String(category.name)}
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
						<Input autoComplete="off" id="title" name="title" required />
					</div>
					<div className="space-y-1">
						<Label htmlFor="quote">{label("description")}</Label>
						<Textarea autoComplete="off" id="quote" name="quote" />
					</div>
					<div className="space-y-1">
						<Label htmlFor="url">{label("url")}</Label>
						<div className="flex">
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
