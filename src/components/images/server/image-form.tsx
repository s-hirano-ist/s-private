import type { ServerAction } from "@/common/types";
import { ImageFormClient } from "../client/image-form-client";

type Props = {
	addImage: (formData: FormData) => Promise<ServerAction>;
};

export async function ImageForm({ addImage }: Props) {
	return <ImageFormClient addImage={addImage} />;
}
