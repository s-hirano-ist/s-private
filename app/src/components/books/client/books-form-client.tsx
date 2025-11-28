"use client";
import { useTranslations } from "next-intl";
import { FormInput } from "s-ui/forms/fields/form-input";
import { GenericFormWrapper } from "s-ui/forms/generic-form-wrapper";
import { toast } from "sonner";
import type { ServerAction } from "@/common/types";

type Props = {
	addBooks: (formData: FormData) => Promise<ServerAction>;
};

export function BooksFormClient({ addBooks }: Props) {
	const label = useTranslations("label");
	const message = useTranslations("message");

	const afterSubmit = (responseMessage: string) => {
		toast(message(responseMessage));
	};

	return (
		<GenericFormWrapper<ServerAction>
			action={addBooks}
			afterSubmit={afterSubmit}
			saveLabel={label("save")}
		>
			<FormInput
				autoComplete="off"
				htmlFor="isbn"
				label="ISBN"
				name="isbn"
				placeholder="978-4-XXXX-XXXX-X"
				required
			/>
			<FormInput
				autoComplete="off"
				htmlFor="title"
				label={label("title")}
				name="title"
				required
			/>
		</GenericFormWrapper>
	);
}
