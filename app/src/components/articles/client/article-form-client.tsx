"use client";
import { FormDropdownInput } from "@s-hirano-ist/s-ui/forms/fields/form-dropdown-input";
import { FormInput } from "@s-hirano-ist/s-ui/forms/fields/form-input";
import { FormInputWithButton } from "@s-hirano-ist/s-ui/forms/fields/form-input-with-button";
import { FormTextarea } from "@s-hirano-ist/s-ui/forms/fields/form-textarea";
import { GenericFormWrapper } from "@s-hirano-ist/s-ui/forms/generic-form-wrapper";
import { ClipboardPasteIcon, TableOfContentsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";
import type { ServerAction } from "@/common/types";

export type ArticleFormClientData = { id: string; name: string }[];

type Props = {
	categories: ArticleFormClientData;
	addArticle: (formData: FormData) => Promise<ServerAction>;
};

export function ArticleFormClient({ categories, addArticle }: Props) {
	const urlInputReference = useRef<HTMLInputElement>(null);
	const categoryInputReference = useRef<HTMLInputElement>(null);

	const label = useTranslations("label");
	const message = useTranslations("message");

	const handlePasteClick = async () => {
		const clipboardText = await navigator.clipboard.readText();
		if (urlInputReference.current !== null)
			urlInputReference.current.value = clipboardText;
	};

	const afterSubmit = (responseMessage: string) => {
		toast(message(responseMessage));
	};

	return (
		<GenericFormWrapper<ServerAction>
			action={addArticle}
			afterSubmit={afterSubmit}
			saveLabel={label("save")}
		>
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
