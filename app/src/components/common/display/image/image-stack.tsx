"use client";
import Image from "next/image";
import { useState } from "react";
import { StatusCodeView } from "s-private-components/display/status/status-code-view";
import Lightbox from "yet-another-react-lightbox";
import type { DeleteAction } from "@/common/types";
import { DeleteButtonWithModal } from "@/components/common/forms/actions/delete-button-with-modal";
import "yet-another-react-lightbox/styles.css";
import { useTranslations } from "next-intl";

export type ImageData = {
	id?: string;
	originalPath: string;
	thumbnailPath: string;
	height?: number | null;
	width?: number | null;
};

type Props = {
	data: ImageData[];
	showDeleteButton: boolean;
	deleteAction?: DeleteAction;
};

type SlideImage = {
	src: string;
	alt: string;
	height?: number;
	width?: number;
};

export function ImageStack({ data, showDeleteButton, deleteAction }: Props) {
	const [open, setOpen] = useState(false);
	const [index, setIndex] = useState(0);
	const t = useTranslations("statusCode");

	if (data.length === 0)
		return <StatusCodeView statusCode="204" statusCodeString={t("204")} />;

	const slides: SlideImage[] = data.map((image) => ({
		src: image.originalPath,
		width: image.width || undefined,
		height: image.height || undefined,
		alt: `Image ${image.originalPath}`,
	}));

	const handleImageClick = (imageIndex: number) => {
		setIndex(imageIndex);
		setOpen(true);
	};

	return (
		<>
			<div className="grid grid-cols-4 gap-2 p-2 sm:p-4">
				{data.map((image, i) => (
					<div className="relative" key={image.id || image.originalPath}>
						<div
							aria-label={`Open image ${image.originalPath} in lightbox`}
							className="cursor-pointer"
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
								alt={`Image ${image.originalPath}`}
								height={96}
								src={image.thumbnailPath}
								unoptimized
								width={300}
							/>
						</div>
						{showDeleteButton && deleteAction !== undefined && image.id && (
							<DeleteButtonWithModal
								deleteAction={deleteAction}
								id={image.id}
								title={image.originalPath}
							/>
						)}
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
