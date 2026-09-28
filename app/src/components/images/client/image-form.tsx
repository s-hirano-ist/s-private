"use client";
import type { ServerAction } from "@/common/types";
import type { CreateOutcome } from "@/components/common/forms/create-flow-context";
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

	const handleSubmit = async (formData: FormData): Promise<CreateOutcome> => {
		const files = formData
			.getAll("files")
			.filter(
				(value): value is File => value instanceof File && value.size > 0,
			);
		const retryData = new FormData();
		let failureMessage = "error";

		for (const file of files) {
			const individualFormData = new FormData();
			individualFormData.append("file", file);
			try {
				const response = await addImage(individualFormData);
				if (!response.success) {
					retryData.append("files", file);
					failureMessage = response.message;
				}
			} catch {
				retryData.append("files", file);
			}
		}
		return retryData.has("files") || files.length === 0
			? {
					response: { success: false, message: failureMessage },
					retryData,
				}
			: { response: { success: true, message: "inserted" } };
	};
	const afterSubmit = (response: ServerAction) => {
		toast[response.success ? "success" : "error"](message(response.message));
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
