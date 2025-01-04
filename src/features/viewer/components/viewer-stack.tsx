import type { Image, ImageType } from "../types";
import { ViewerPreview } from "./viewer-preview";

type Props = {
	images: Image[];
	path: string;
	imageType: ImageType;
};

export function ViewerStack({ images, path, imageType }: Props) {
	return (
		<div className="my-2 grid grid-cols-2 items-stretch gap-4 px-2 sm:grid-cols-4">
			{images.map((image) => {
				return (
					<ViewerPreview
						image={image}
						path={path}
						imageType={imageType}
						key={image.title}
					/>
				);
			})}
		</div>
	);
}
