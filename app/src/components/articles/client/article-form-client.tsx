"use client";
import { ClipboardPasteIcon, TableOfContentsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import type { ServerAction } from "@/common/types";
import { FormDropdownInput } from "@/components/common/forms/fields/form-dropdown-input";
import { FormInput } from "@/components/common/forms/fields/form-input";
import { FormInputWithButton } from "@/components/common/forms/fields/form-input-with-button";
import { FormTextarea } from "@/components/common/forms/fields/form-textarea";
import { GenericFormWrapper } from "@/components/common/forms/generic-form-wrapper";

export type ArticleFormClientData = { id: string; name: string }[];

type Props = {
	categories: ArticleFormClientData;
	addArticle: (formData: FormData) => Promise<ServerAction>;
};

export function ArticleFormClient({ categories, addArticle }: Props) {
	const urlInputReference = useRef<HTMLInputElement>(null);
	const categoryInputReference = useRef<HTMLInputElement>(null);

	const label = useTranslations("label");

	const handlePasteClick = async () => {
		const clipboardText = await navigator.clipboard.readText();
		if (urlInputReference.current !== null)
			urlInputReference.current.value = clipboardText;
	};

	return (
		<GenericFormWrapper action={addArticle}>
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
