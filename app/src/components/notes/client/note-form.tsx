"use client";
import type { ServerAction } from "@/common/types";
import { FormInput } from "@/components/common/forms/fields/form-input";
import { FormTextarea } from "@/components/common/forms/fields/form-textarea";
import { GenericFormWrapper } from "@/components/common/forms/generic-form-wrapper";
import { useToast } from "@s-hirano-ist/s-ui/toast";
import { useTranslations } from "next-intl";

type Props = {
	addNote: (formData: FormData) => Promise<ServerAction>;
};

export function NoteForm({ addNote }: Props) {
	const toast = useToast();
	const label = useTranslations("label");
	const message = useTranslations("message");

	const afterSubmit = (responseMessage: string) => {
		toast.show(message(responseMessage));
	};

	return (
		<GenericFormWrapper<ServerAction>
			action={addNote}
			afterSubmit={afterSubmit}
			saveLabel={label("save")}
		>
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
