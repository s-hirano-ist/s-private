"use client";
import { useTranslations } from "next-intl";
import { FormInput } from "@/components/forms/fields/form-input";
import { GenericFormWrapper } from "@/components/forms/generic-form-wrapper";

type Props = {
	addBooks: (formData: FormData) => Promise<{ message: string }>;
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
