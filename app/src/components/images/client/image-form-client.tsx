"use client";
import { useTranslations } from "next-intl";
import { FormFileInput } from "s-private-components/forms/fields/form-file-input";
import { GenericFormWrapper } from "s-private-components/forms/generic-form-wrapper";
import { toast } from "sonner";
import type { ServerAction } from "@/common/types";

type Props = {
	addImage: (formData: FormData) => Promise<ServerAction>;
};

export function ImageFormClient({ addImage }: Props) {
	const label = useTranslations("label");
	const message = useTranslations("message");

	const handleSubmit = async (formData: FormData) => {
		const files = formData.getAll("files");

		for (const file of files) {
			const individualFormData = new FormData();
			individualFormData.append("file", file);

			const response = await addImage(individualFormData);
			toast(message(response.message));
		}
	};
	const afterSubmit = (responseMessage: string) => {
		toast(message(responseMessage));
	};

	return (
		<GenericFormWrapper<ServerAction>
			action={addImage}
			afterSubmit={afterSubmit}
			loadingLabel={label("uploading")}
			onSubmit={handleSubmit}
			saveLabel={label("save")}
			submitLabel={label("upload")}
		>
			<FormFileInput
				accept="image/*"
				htmlFor="files"
				label={label("image")}
				multiple
				name="files"
				required
			/>
		</GenericFormWrapper>
	);
}
