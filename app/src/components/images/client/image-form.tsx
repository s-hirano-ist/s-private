"use client";
import type { ServerAction } from "@/common/types";
import { FormFileInput } from "@/components/common/forms/fields/form-file-input";
import { GenericFormWrapper } from "@/components/common/forms/generic-form-wrapper";
import { useToast } from "@s-hirano-ist/s-ui/toast";
import { useTranslations } from "next-intl";

type Props = {
	addImage: (formData: FormData) => Promise<ServerAction>;
};

export function ImageForm({ addImage }: Props) {
	const toast = useToast();
	const label = useTranslations("label");
	const message = useTranslations("message");

	const handleSubmit = async (formData: FormData) => {
		const files = formData.getAll("files");

		for (const file of files) {
			const individualFormData = new FormData();
			individualFormData.append("file", file);

			const response = await addImage(individualFormData);
			toast.show(message(response.message));
		}
	};
	const afterSubmit = (responseMessage: string) => {
		toast.show(message(responseMessage));
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
