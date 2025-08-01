"use client";
import { ClipboardPasteIcon, TableOfContentsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useRef } from "react";
import { toast } from "sonner";
import {
	ActionButton,
	FormField,
	InputField,
	InputWithButton,
	InputWithDropdown,
	TextareaField,
} from "@/components/composition/form-field";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddFormSkeleton } from "@/features/dump/components/add-form-skeleton";
import { addNews } from "@/features/news/actions/add-news";

type Props = { categories: { id: number; name: string }[] };

export function AddNewsForm({ categories }: Props) {
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
					<FormField htmlFor="category" label={label("category")} required>
						<InputWithDropdown
							dropdownTrigger={
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
							}
							inputProps={{ name: "category", required: true }}
							inputRef={categoryInputReference}
						/>
					</FormField>

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
