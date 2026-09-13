"use client";
import type { ServerAction } from "@/common/types";
import { FormDropdownInput } from "@/components/common/forms/fields/form-dropdown-input";
import { FormInput } from "@/components/common/forms/fields/form-input";
import { FormInputWithButton } from "@/components/common/forms/fields/form-input-with-button";
import { FormTextarea } from "@/components/common/forms/fields/form-textarea";
import { GenericFormWrapper } from "@/components/common/forms/generic-form-wrapper";
import { useToast } from "@s-hirano-ist/s-ui/toast";
import { ClipboardPasteIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

export type ArticleFormData = { id: string; name: string }[];

type Props = {
	addArticle: (formData: FormData) => Promise<ServerAction>;
	getCategories: () => Promise<ArticleFormData>;
};

export function ArticleForm({ addArticle, getCategories }: Props) {
	const toast = useToast();
	const urlInputReference = useRef<HTMLInputElement>(null);
	const categoryInputReference = useRef<HTMLInputElement>(null);
	const hasRequestedCategories = useRef(false);
	const [categories, setCategories] = useState<ArticleFormData>([]);
	const [isLoadingCategories, startCategoryTransition] = useTransition();

	const label = useTranslations("label");
	const message = useTranslations("message");

	const handlePasteClick = async () => {
		const clipboardText = await navigator.clipboard.readText();
		if (urlInputReference.current !== null)
			urlInputReference.current.value = clipboardText;
	};

	const afterSubmit = (responseMessage: string) => {
		toast.show(message(responseMessage));
	};

	const handleCategoryOpenChange = (open: boolean) => {
		if (!open || hasRequestedCategories.current) return;

		hasRequestedCategories.current = true;
		startCategoryTransition(async () => {
			setCategories(await getCategories());
		});
	};

	return (
		<GenericFormWrapper<ServerAction>
			action={addArticle}
			afterSubmit={afterSubmit}
			saveLabel={label("save")}
		>
			<FormDropdownInput
				customValueLabel={(v) => label("useCustomValue", { value: v })}
				emptyMessage={
					isLoadingCategories ? label("loading") : label("noResults")
				}
				htmlFor="category"
				inputRef={categoryInputReference}
				label={label("category")}
				name="category"
				onOpenChange={handleCategoryOpenChange}
				options={categories}
				placeholder={label("select")}
				required
				searchPlaceholder={label("searchPlaceholder")}
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
