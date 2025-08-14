"use client";
import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import { StatusCodeView } from "@/components/status/status-code-view";
import "yet-another-react-lightbox/styles.css";

type ImageData = {
	paths: string;
	height?: number | null;
	width?: number | null;
};

type Props = { data: ImageData[] };

type SlideImage = {
	src: string;
	alt?: string;
	height?: number;
	width?: number;
};

const API_ORIGINAL_PATH = "/api/contents/original";
const API_THUMBNAIL_PATH = "/api/contents/thumbnail";

export function ImageStack({ data }: Props) {
	const [open, setOpen] = useState(false);
	const [index, setIndex] = useState(0);

	if (data.length === 0) return <StatusCodeView statusCode="204" />;

	const slides: SlideImage[] = data.map((image) => ({
		src: `${API_ORIGINAL_PATH}/${image.paths}`,
		width: image.width || undefined,
		height: image.height || undefined,
		alt: `Image ${image.paths}`,
	}));

	const handleImageClick = (imageIndex: number) => {
		setIndex(imageIndex);
		setOpen(true);
	};

	return (
		<>
			<div className="grid grid-cols-4 gap-2 p-2 sm:p-4">
				{data.map((image, i) => (
					<div
						aria-label={`Open image ${image.paths} in lightbox`}
						className="cursor-pointer"
						key={image.paths}
						onClick={() => handleImageClick(i)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								handleImageClick(i);
							}
						}}
						role="button"
						tabIndex={0}
					>
						<Image
							alt={`Image ${image.paths}`}
							height={96}
							src={`${API_THUMBNAIL_PATH}/${image.paths}`}
							// FIXME: optimize image for better performance
							// Note that it may not be needed due to thumbnail size is already small
							unoptimized
							width={300}
						/>
					</div>
				))}
			</div>
			<Lightbox
				close={() => setOpen(false)}
				index={index}
				open={open}
				slides={slides}
			/>
		</>
	);
}
