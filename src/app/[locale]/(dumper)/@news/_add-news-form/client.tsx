"use client";
import { ClipboardPasteIcon, TableOfContentsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { FormDropdownInput } from "@/components/forms/fields/form-dropdown-input";
import { FormInput } from "@/components/forms/fields/form-input";
import { FormInputWithButton } from "@/components/forms/fields/form-input-with-button";
import { FormTextarea } from "@/components/forms/fields/form-textarea";
import { GenericFormWrapper } from "@/components/forms/generic-form-wrapper";

type Props = {
	categories: { id: number; name: string }[];
	addNews: (formData: FormData) => Promise<{ message: string }>;
};

export function AddNewsFormClient({ categories, addNews }: Props) {
	const urlInputReference = useRef<HTMLInputElement>(null);
	const categoryInputReference = useRef<HTMLInputElement>(null);

	const label = useTranslations("label");

	const handlePasteClick = async () => {
		const clipboardText = await navigator.clipboard.readText();
		if (urlInputReference.current !== null)
			urlInputReference.current.value = clipboardText;
	};

	return (
		<GenericFormWrapper action={addNews}>
			<FormDropdownInput
				autoComplete="off"
				htmlFor="category"
				inputRef={categoryInputReference}
				label={label("category")}
				name="category"
				options={categories}
				required
				triggerIcon={<TableOfContentsIcon />}
			/>
			<FormInput
				autoComplete="off"
				htmlFor="title"
				label={label("title")}
				name="title"
				required
			/>
			<FormTextarea
				autoComplete="off"
				htmlFor="quote"
				label={label("description")}
				name="quote"
			/>
			<FormInputWithButton
				autoComplete="off"
				buttonIcon={<ClipboardPasteIcon />}
				buttonTestId="paste-button"
				htmlFor="url"
				inputMode="url"
				inputRef={urlInputReference}
				label={label("url")}
				name="url"
				onButtonClick={handlePasteClick}
				required
				type="url"
			/>
		</GenericFormWrapper>
	);
}
