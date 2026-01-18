import "server-only";

import type { ServerAction } from "@/common/types";
import { ImageForm } from "@/components/images/client/image-form";
import type { BaseLoaderProps } from "@/loaders/types";

export type ImageFormLoaderProps = BaseLoaderProps & {
	addImage: (formData: FormData) => Promise<ServerAction>;
};

export async function ImageFormLoader({ addImage }: ImageFormLoaderProps) {
	return <ImageForm addImage={addImage} />;
}
