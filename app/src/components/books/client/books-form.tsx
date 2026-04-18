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
				placeholder="9784774189673"
				required
			/>
			<FormInput
				autoComplete="off"
				htmlFor="title"
				label={label("title")}
				name="title"
				required
			/>
			<FormInput
				autoComplete="off"
				htmlFor="rating"
				label={label("rating")}
				max={5}
				min={1}
				name="rating"
				required
				step={1}
				type="number"
			/>
			<FormInput
				autoComplete="off"
				htmlFor="tags"
				label={label("tags")}
				name="tags"
				placeholder="tag1, tag2"
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
