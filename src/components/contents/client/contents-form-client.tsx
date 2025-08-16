"use client";
import { useTranslations } from "next-intl";
import { FormInput } from "@/common/components/forms/fields/form-input";
import { FormTextarea } from "@/common/components/forms/fields/form-textarea";
import { GenericFormWrapper } from "@/common/components/forms/generic-form-wrapper";
import type { ServerAction } from "@/common/types";

type Props = {
	addContents: (formData: FormData) => Promise<ServerAction>;
};

export function ContentsFormClient({ addContents }: Props) {
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
