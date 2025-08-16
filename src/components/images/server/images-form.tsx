import { ServerAction } from "@/common/types";
import { ImagesFormClient } from "../client/images-form-client";

type Props = {
	addImage: (formData: FormData) => Promise<ServerAction>;
};

export async function ImagesForm({ addImage }: Props) {
	return <ImagesFormClient addImage={addImage} />;
}
