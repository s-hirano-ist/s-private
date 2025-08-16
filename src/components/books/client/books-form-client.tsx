"use client";
import { useTranslations } from "next-intl";
import type { ServerAction } from "@/common/types";
import { FormInput } from "@/components/common/forms/fields/form-input";
import { GenericFormWrapper } from "@/components/common/forms/generic-form-wrapper";

type Props = {
	addBooks: (formData: FormData) => Promise<ServerAction>;
};

export function BooksFormClient({ addBooks }: Props) {
	const label = useTranslations("label");

	return (
		<GenericFormWrapper action={addBooks}>
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
