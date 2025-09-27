"use client";
import { useTranslations } from "next-intl";
import type { ServerAction } from "@/common/types";
import { FormInput } from "@/components/common/forms/fields/form-input";
import { FormTextarea } from "@/components/common/forms/fields/form-textarea";
import { GenericFormWrapper } from "@/components/common/forms/generic-form-wrapper";

type Props = {
	addNote: (formData: FormData) => Promise<ServerAction>;
};

export function NoteFormClient({ addNote }: Props) {
	const label = useTranslations("label");

	return (
		<GenericFormWrapper action={addNote}>
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
