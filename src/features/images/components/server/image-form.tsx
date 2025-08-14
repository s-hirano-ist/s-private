import { forbidden } from "next/navigation";
import { Unexpected } from "@/components/status/unexpected";
import { hasDumperPostPermission } from "@/utils/auth/session";
import { ServerAction } from "@/utils/types";
import { ImageFormClient } from "../client/image-form-client";

type Props = {
	addImage: (formData: FormData) => Promise<ServerAction>;
};

export async function ImageForm({ addImage }: Props) {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) return forbidden();

	try {
		return <ImageFormClient addImage={addImage} />;
	} catch (error) {
		return <Unexpected caller="ImageForm" error={error} />;
	}
}
