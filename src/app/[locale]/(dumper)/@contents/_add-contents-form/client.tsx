"use client";
import { useTranslations } from "next-intl";
import { FormInput } from "@/components/forms/fields/form-input";
import { FormTextarea } from "@/components/forms/fields/form-textarea";
import { GenericFormWrapper } from "@/components/forms/generic-form-wrapper";

type Props = {
	addContents: (formData: FormData) => Promise<{ message: string }>;
};

export function AddContentsFormClient({ addContents }: Props) {
	const label = useTranslations("label");

	return (
		<GenericFormWrapper action={addContents}>
			<FormInput
				autoComplete="off"
				htmlFor="title"
				label={label("title")}
				name="title"
				required
			/>
			<FormTextarea
				autoComplete="off"
				className="min-h-[200px]"
				htmlFor="markdown"
				label={label("description")}
				name="markdown"
				required
			/>
		</GenericFormWrapper>
	);
}
