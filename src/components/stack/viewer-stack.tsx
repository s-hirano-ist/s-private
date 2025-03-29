"use client";
import {
	Image,
	ImageType,
	ViewerPreview,
} from "@/components/card/viewer-preview";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { useTransitionRouter } from "next-view-transitions";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const PARAM_NAME = "q";

type Props = {
	images: Image[];
	imageType: ImageType;
	path: string;
};

export function ViewerStack({ images, path, imageType }: Props) {
	// TODO: use queryを利用してデータのキャッシュを行う

	const router = useTransitionRouter();
	const searchParams = useSearchParams();
	const [searchTerm, setSearchTerm] = useState(
		searchParams.get(PARAM_NAME) ?? "",
	);
	const [searchResults, setSearchResults] = useState(images);

	const fetchSearchResults = useCallback(
		async (searchString: string) => {
			if (searchString === "") setSearchResults(images);
			else
				setSearchResults(
					images.filter((image) => image.title.includes(searchString)),
				);
		},
		[images],
	);

	const debouncedSearch = useDebouncedCallback(async (searchString: string) => {
		const params = new URLSearchParams(searchParams);
		if (searchString) params.set(PARAM_NAME, searchString);
		else params.delete(PARAM_NAME);

		router.push(`?${params.toString()}`);
		await fetchSearchResults(searchString);
	}, 300);

	const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const term = e.target.value;
		setSearchTerm(term);
		await debouncedSearch(term);
	};

	const t = useTranslations("label");

	return (
		<div className="px-2">
			<Input
				className="my-4"
				onChange={handleSearchChange}
				placeholder={t("search")}
				type="q"
				value={searchTerm}
			/>
			<div className="my-2 grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-4">
				{searchResults.map((image) => {
					return (
						<ViewerPreview
							image={image}
							imageType={imageType}
							key={image.title}
							path={path}
						/>
					);
				})}
			</div>
		</div>
	);
}
