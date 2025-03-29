"use client";
import { StatusCodeView } from "@/components/card/status-code-view";
import Image from "next/image";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import { useEffect } from "react";
import "photoswipe/style.css";

type Properties = {
	data: {
		height?: number | undefined;
		originalSrc: string;
		thumbnailSrc: string;
		width?: number | undefined;
	}[];
};

export function ImageStack({ data }: Properties) {
	useEffect(() => {
		const lightbox = new PhotoSwipeLightbox({
			gallery: "#image-preview",
			children: "a",
			pswpModule: () => import("photoswipe"),
			bgOpacity: 1,
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
						aria-label={`Image ${image.thumbnailSrc}`}
						data-pswp-height={image.height}
						data-pswp-width={image.width}
						href={image.originalSrc}
						key={image.thumbnailSrc}
						rel="noreferrer"
						target="_blank"
						// FIXME: not foundの画像が複数枚あるときにエラー
					>
						<Image alt="" height={96} src={image.thumbnailSrc} width={300} />
					</a>
				))}
			</div>
		</div>
	);
}
