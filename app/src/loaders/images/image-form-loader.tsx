import "server-only";
import type { ServerAction } from "@/common/types";
import type { BaseLoaderProps } from "@/loaders/types";
import { ImageForm } from "@/components/images/client/image-form";

export type ImageFormLoaderProps = BaseLoaderProps & {
	addImage: (formData: FormData) => Promise<ServerAction>;
};

export async function ImageFormLoader({ addImage }: ImageFormLoaderProps) {
	return <ImageForm addImage={addImage} />;
}
