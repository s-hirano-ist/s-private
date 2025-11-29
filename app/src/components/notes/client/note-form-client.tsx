"use client";
import { FormInput } from "@s-hirano-ist/s-ui/forms/fields/form-input";
import { FormTextarea } from "@s-hirano-ist/s-ui/forms/fields/form-textarea";
import { GenericFormWrapper } from "@s-hirano-ist/s-ui/forms/generic-form-wrapper";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ServerAction } from "@/common/types";

type Props = {
	addNote: (formData: FormData) => Promise<ServerAction>;
};

export function NoteFormClient({ addNote }: Props) {
	const label = useTranslations("label");
	const message = useTranslations("message");

	const afterSubmit = (responseMessage: string) => {
		toast(message(responseMessage));
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
