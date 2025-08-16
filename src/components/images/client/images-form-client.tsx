"use client";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ServerAction } from "@/common/types";
import { FormFileInput } from "@/components/common/forms/fields/form-file-input";
import { GenericFormWrapper } from "@/components/common/forms/generic-form-wrapper";

type Props = {
	addImage: (formData: FormData) => Promise<ServerAction>;
};

export function ImagesFormClient({ addImage }: Props) {
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

	return (
		<GenericFormWrapper
			action={addImage}
			loadingLabel="uploading"
			onSubmit={handleSubmit}
			submitLabel="upload"
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
