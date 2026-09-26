"use client";
import type { DeleteAction, LoadMoreAction } from "@/common/types";
import type { CardStackInitialData } from "@/components/common/layouts/cards/types";
import type { LightboxExternalProps } from "yet-another-react-lightbox";
import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { DeleteButtonWithModal } from "@/components/common/forms/actions/delete-button-with-modal";
import { useInfiniteScroll } from "@s-hirano-ist/s-ui/hooks/use-infinite-scroll";
import { LoadingIndicator } from "@s-hirano-ist/s-ui/loading-indicator";
import { haptic } from "@s-hirano-ist/s-ui/utils/haptic";
import { useTranslations } from "next-intl";
import Image from "next/image";
import "yet-another-react-lightbox/styles.css";
import { useState, useTransition } from "react";

type LightboxComponent = React.ComponentType<LightboxExternalProps>;

let lightboxPromise: Promise<LightboxComponent> | undefined;

function loadLightbox(): Promise<LightboxComponent> {
	lightboxPromise ??= import("yet-another-react-lightbox").then(
		(module) => module.default,
	);

	return lightboxPromise;
}

export type ImageData = {
	height?: number | null;
	id?: string;
	originalPath: string;
	thumbnailPath: string;
	width?: number | null;
};

type SlideImage = {
	alt: string;
	height?: number;
	src: string;
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
	lastElementRef?: (node: HTMLElement | null) => void;
	onImageClick: (index: number) => void;
	renderOverlay?: (image: ImageData) => React.ReactNode;
};

function ImageStackGrid({
	data,
	lastElementRef,
	onImageClick,
	renderOverlay,
}: ImageStackGridProps) {
	return (
		<div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
			{data.map((image, i) => (
				<div
					className="relative"
					key={image.id || image.originalPath}
					ref={i === data.length - 1 ? lastElementRef : undefined}
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
	lastElementRef?: (node: HTMLElement | null) => void;
};

export function ImageStack({ data, lastElementRef }: ImageStackProps) {
	const [open, setOpen] = useState(false);
	const [index, setIndex] = useState(0);
	const [lightboxComponent, setLightboxComponent] =
		useState<LightboxComponent>();
	const t = useTranslations("statusCode");

	if (data.length === 0)
		return <StatusCodeView statusCode="204" statusCodeString={t("204")} />;

	const slides: SlideImage[] = data.map((image) => ({
		src: image.originalPath,
		width: image.width || undefined,
		height: image.height || undefined,
		alt: `Image ${image.originalPath}`,
	}));

	const Lightbox = lightboxComponent;

	const handleImageClick = (imageIndex: number) => {
		haptic();
		setIndex(imageIndex);
		void loadLightbox().then((component) => {
			setLightboxComponent(() => component);
			setOpen(true);
			return null;
		});
	};

	return (
		<>
			<ImageStackGrid
				data={data}
				lastElementRef={lastElementRef}
				onImageClick={handleImageClick}
			/>
			{open && Lightbox ? (
				<Lightbox
					close={() => setOpen(false)}
					index={index}
					open={open}
					slides={slides}
				/>
			) : null}
		</>
	);
}

type EditableImageStackProps = {
	data: ImageData[];
	deleteAction: DeleteAction;
	lastElementRef?: (node: HTMLElement | null) => void;
};

export function EditableImageStack({
	data,
	deleteAction,
	lastElementRef,
}: EditableImageStackProps) {
	const [open, setOpen] = useState(false);
	const [index, setIndex] = useState(0);
	const [lightboxComponent, setLightboxComponent] =
		useState<LightboxComponent>();
	const t = useTranslations("statusCode");

	if (data.length === 0)
		return <StatusCodeView statusCode="204" statusCodeString={t("204")} />;

	const slides: SlideImage[] = data.map((image) => ({
		src: image.originalPath,
		width: image.width || undefined,
		height: image.height || undefined,
		alt: `Image ${image.originalPath}`,
	}));

	const Lightbox = lightboxComponent;

	return (
		<>
			<ImageStackGrid
				data={data}
				lastElementRef={lastElementRef}
				onImageClick={(i) => {
					setIndex(i);
					haptic();
					void loadLightbox().then((component) => {
						setLightboxComponent(() => component);
						setOpen(true);
						return null;
					});
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
			{open && Lightbox ? (
				<Lightbox
					close={() => setOpen(false)}
					index={index}
					open={open}
					slides={slides}
				/>
			) : null}
		</>
	);
}

type InfiniteImageStackProps = {
	deleteAction?: DeleteAction;
	initial: CardStackInitialData<ImageData>;
	loadMoreAction: LoadMoreAction<CardStackInitialData<ImageData>>;
};

export function InfiniteImageStack({
	deleteAction,
	initial,
	loadMoreAction,
}: InfiniteImageStackProps) {
	const [allData, setAllData] = useState(initial.data);
	const [totalCount, setTotalCount] = useState(initial.totalCount);
	const [previousInitial, setPreviousInitial] = useState(initial);
	const [isPending, startTransition] = useTransition();
	if (previousInitial !== initial) {
		setPreviousInitial(initial);
		setAllData(initial.data);
		setTotalCount(initial.totalCount);
	}
	const hasNextPage = allData.length < totalCount;
	const handleLoadMore = async () => {
		if (!hasNextPage) return;
		startTransition(async () => {
			const result = await loadMoreAction(allData.length);
			if (result.success && result.data) {
				const nextBatch = result.data;
				setTotalCount(nextBatch.totalCount);
				setAllData((current) => {
					const ids = new Set(
						current.map((image) => image.id ?? image.originalPath),
					);
					return [
						...current,
						...nextBatch.data.filter(
							(image) => !ids.has(image.id ?? image.originalPath),
						),
					];
				});
			}
		});
	};
	const { lastElementRef } = useInfiniteScroll({
		hasNextPage,
		isFetchingNextPage: isPending,
		fetchNextPage: handleLoadMore,
	});
	return (
		<>
			{deleteAction ? (
				<EditableImageStack
					data={allData}
					deleteAction={deleteAction}
					lastElementRef={lastElementRef}
				/>
			) : (
				<ImageStack data={allData} lastElementRef={lastElementRef} />
			)}
			{isPending && <LoadingIndicator />}
		</>
	);
}
