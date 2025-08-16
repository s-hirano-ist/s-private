import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import { ServerAction } from "@/common/types";
import { Unexpected } from "@/components/common/status/unexpected";
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
