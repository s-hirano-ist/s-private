import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@s-hirano-ist/s-ui/ui/pagination";
import type { Route } from "next";
import { getTranslations } from "next-intl/server";
import { PAGE_SIZE } from "@/common/constants";
import type { ServerAction } from "@/common/types";
import {
	EditableImageStack,
	type ImageData,
	ImageStack,
} from "@/components/common/display/image/image-stack";

type Props = {
	currentPage: number;
	totalCount: number;
	data: ImageData[];
	deleteAction?: (id: string) => Promise<ServerAction>;
};

function generatePageLink(page: number): Route {
	const params = new URLSearchParams();
	params.set("page", String(page));
	return `?${params.toString()}` as Route;
}

type PaginationItemType =
	| { type: "page"; page: number }
	| { type: "ellipsis"; position: "start" | "end" };

function generatePaginationItems(
	currentPage: number,
	totalPages: number,
): PaginationItemType[] {
	const items: PaginationItemType[] = [];

	// Always show first page
	items.push({ type: "page", page: 1 });

	if (currentPage > 3) {
		items.push({ type: "ellipsis", position: "start" });
	}

	// Pages around current
	for (
		let i = Math.max(2, currentPage - 1);
		i <= Math.min(totalPages - 1, currentPage + 1);
		i++
	) {
		items.push({ type: "page", page: i });
	}

	if (currentPage < totalPages - 2) {
		items.push({ type: "ellipsis", position: "end" });
	}

	// Always show last page if more than 1 page
	if (totalPages > 1) {
		items.push({ type: "page", page: totalPages });
	}

	return items;
}

export async function ImagesStack({
	currentPage,
	totalCount,
	data,
	deleteAction,
}: Props) {
	const totalPages = Math.ceil(totalCount / PAGE_SIZE);
	const t = await getTranslations("label");

	const showPagination = totalPages > 1;

	return (
		<>
			{deleteAction !== undefined ? (
				<EditableImageStack data={data} deleteAction={deleteAction} />
			) : (
				<ImageStack data={data} />
			)}
			{showPagination && (
				<Pagination className="mt-4">
					<PaginationContent>
						{currentPage > 1 && (
							<PaginationItem>
								<PaginationPrevious
									href={generatePageLink(currentPage - 1)}
									label={t("previous")}
								/>
							</PaginationItem>
						)}
						{generatePaginationItems(currentPage, totalPages).map((item) =>
							item.type === "ellipsis" ? (
								<PaginationItem key={`ellipsis-${item.position}`}>
									<PaginationEllipsis srLabel={t("morePages")} />
								</PaginationItem>
							) : (
								<PaginationItem key={item.page}>
									<PaginationLink
										href={generatePageLink(item.page)}
										isActive={item.page === currentPage}
									>
										{item.page}
									</PaginationLink>
								</PaginationItem>
							),
						)}
						{currentPage < totalPages && (
							<PaginationItem>
								<PaginationNext
									href={generatePageLink(currentPage + 1)}
									label={t("next")}
								/>
							</PaginationItem>
						)}
					</PaginationContent>
				</Pagination>
			)}
		</>
	);
}
