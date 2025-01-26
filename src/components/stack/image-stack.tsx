"use client";
import { StatusCodeView } from "@/components/card/status-code-view";
import Image from "next/image";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import { useEffect } from "react";
import "photoswipe/style.css";

type Props = {
	data: {
		thumbnailSrc: string;
		originalSrc: string;
		width?: number | undefined;
		height?: number | undefined;
	}[];
};

export function ImageStack({ data }: Props) {
	useEffect(() => {
		const lightbox = new PhotoSwipeLightbox({
			gallery: "#image-preview",
			children: "a",
			pswpModule: () => import("photoswipe"),
			bgOpacity: 1.0,
		});
		lightbox.init();

		return () => {
			lightbox.destroy();
		};
	}, []);

	if (data.length === 0) return <StatusCodeView statusCode="204" />;

	return (
		// eslint-disable-next-line
		<div className="pswp-gallery" id="image-preview">
			<div className="grid grid-cols-4 gap-2 p-2 sm:p-4">
				{data.map((image) => (
					<a
						href={image.originalSrc}
						target="_blank"
						rel="noreferrer"
						// FIXME: not foundの画像が複数枚あるときにエラー
						key={image.thumbnailSrc}
						data-pswp-width={image.width}
						data-pswp-height={image.height}
						aria-label={`Image ${image.thumbnailSrc}`}
					>
						<Image src={image.thumbnailSrc} width={300} height={96} alt="" />
					</a>
				))}
			</div>
		</div>
	);
}
