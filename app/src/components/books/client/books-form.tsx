"use client";
import { FormFileInput } from "@s-hirano-ist/s-ui/forms/fields/form-file-input";
import { FormInput } from "@s-hirano-ist/s-ui/forms/fields/form-input";
import { GenericFormWrapper } from "@s-hirano-ist/s-ui/forms/generic-form-wrapper";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ServerAction } from "@/common/types";

type Props = {
	addBooks: (formData: FormData) => Promise<ServerAction>;
};

export function BooksForm({ addBooks }: Props) {
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
			<FormFileInput
				accept="image/*"
				htmlFor="image"
				label={label("bookCover")}
				name="image"
			/>
		</GenericFormWrapper>
	);
}
