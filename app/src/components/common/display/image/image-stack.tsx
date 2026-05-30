"use client";
import type { DeleteAction } from "@/common/types";
import { DeleteButtonWithModal } from "@/components/common/forms/actions/delete-button-with-modal";
import { StatusCodeView } from "@s-hirano-ist/s-ui/display/status/status-code-view";
import { haptic } from "@s-hirano-ist/s-ui/utils/haptic";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import "yet-another-react-lightbox/styles.css";
import { useState } from "react";

const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
	ssr: false,
});

export type ImageData = {
	id?: string;
	originalPath: string;
	thumbnailPath: string;
	height?: number | null;
	width?: number | null;
};

type SlideImage = {
	src: string;
	alt: string;
	height?: number;
	width?: number;
};

type ImageClickableProps = {
	image: ImageData;
	onImageClick: () => void;
};

function ImageClickable({ image, onImageClick }: ImageClickableProps) {
	return (
		<button
			aria-label={`Open image ${image.originalPath} in lightbox`}
			className="cursor-pointer"
			onClick={onImageClick}
			type="button"
		>
			<Image
				alt={`Image ${image.originalPath}`}
				height={96}
				src={image.thumbnailPath}
				unoptimized
				width={300}
			/>
		</button>
	);
}

type ImageStackGridProps = {
	data: ImageData[];
	onImageClick: (index: number) => void;
	renderOverlay?: (image: ImageData) => React.ReactNode;
};

function ImageStackGrid({
	data,
	onImageClick,
	renderOverlay,
}: ImageStackGridProps) {
	return (
		<div className="grid grid-cols-4 gap-2 p-2 sm:p-4">
			{data.map((image, i) => (
				<div
					className="relative"
					key={image.id || image.originalPath}
					style={{
						contentVisibility: "auto",
						containIntrinsicSize: "auto 96px",
					}}
				>
					<ImageClickable image={image} onImageClick={() => onImageClick(i)} />
					{renderOverlay?.(image)}
				</div>
			))}
		</div>
	);
}

type ImageStackProps = {
	data: ImageData[];
};

export function ImageStack({ data }: ImageStackProps) {
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
		haptic();
		setIndex(imageIndex);
		setOpen(true);
	};

	return (
		<>
			<ImageStackGrid data={data} onImageClick={handleImageClick} />
			{open && (
				<Lightbox
					close={() => setOpen(false)}
					index={index}
					open={open}
					slides={slides}
				/>
			)}
		</>
	);
}

type EditableImageStackProps = {
	data: ImageData[];
	deleteAction: DeleteAction;
};

export function EditableImageStack({
	data,
	deleteAction,
}: EditableImageStackProps) {
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

	return (
		<>
			<ImageStackGrid
				data={data}
				onImageClick={(i) => {
					setIndex(i);
					haptic();
					setOpen(true);
				}}
				renderOverlay={(image) =>
					image.id ? (
						<DeleteButtonWithModal
							deleteAction={deleteAction}
							id={image.id}
							title={image.originalPath}
						/>
					) : null
				}
			/>
			{open && (
				<Lightbox
					close={() => setOpen(false)}
					index={index}
					open={open}
					slides={slides}
				/>
			)}
		</>
	);
}
