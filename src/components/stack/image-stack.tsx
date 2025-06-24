"use client";
import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import { StatusCodeView } from "@/components/card/status-code-view";
import "yet-another-react-lightbox/styles.css";

type Props = {
	data: {
		height?: number | null;
		id: string;
		width?: number | null;
	}[];
};

type SlideImage = {
	alt?: string;
	height?: number;
	src: string;
	width?: number;
};

export function ImageStack({ data }: Props) {
	const [open, setOpen] = useState(false);
	const [index, setIndex] = useState(0);

	if (data.length === 0) return <StatusCodeView statusCode="204" />;

	const slides: SlideImage[] = data.map((image) => ({
		src: `/api/contents/original/${image.id}`,
		width: image.width || undefined,
		height: image.height || undefined,
		alt: `Image ${image.id}`,
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
						aria-label={`Open image ${image.id} in lightbox`}
						className="cursor-pointer"
						key={image.id}
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
							alt={`Image ${image.id}`}
							height={96}
							src={`/api/contents/thumbnail/${image.id}`}
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
