"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/common/ui/badge";
import {
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
	Pagination as ShadcnPagination,
} from "@/components/common/ui/pagination";

type Props = {
	currentPage: number;
	totalItems: number;
	itemsPerPage: number;
	label: string;
};

export function BadgeWithPagination({
	currentPage,
	totalItems,
	itemsPerPage,
	label,
}: Props) {
	const t = useTranslations("label");

	const totalPages = Math.ceil(totalItems / itemsPerPage);

	const isPreviousDisabled = currentPage <= 1;
	const isNextDisabled = currentPage >= totalPages;

	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	const pathname = usePathname();
	const searchParams = useSearchParams();

	const createPageHref = (targetPage: number) => {
		const params = new URLSearchParams(searchParams);
		params.set("page", String(targetPage));

		if (targetPage <= 1) params.delete("page");

		const qs = params.toString();
		return qs ? `?${qs}` : pathname;
	};

	const prevHref = isPreviousDisabled ? "#" : createPageHref(currentPage - 1);
	const nextHref = isNextDisabled ? "#" : createPageHref(currentPage + 1);

	return (
		<ShadcnPagination className="w-full px-4">
			<PaginationContent className="w-full justify-between">
				<PaginationItem>
					<PaginationPrevious
						className={
							isPreviousDisabled ? "pointer-events-none opacity-50" : undefined
						}
						href={prevHref}
					/>
				</PaginationItem>
				<PaginationItem className="flex-1">
					<Badge className="flex justify-center w-full">
						{t(label)} : {startItem} ~ {endItem} / {totalItems}
					</Badge>
				</PaginationItem>
				<PaginationItem>
					<PaginationNext
						className={
							isNextDisabled ? "pointer-events-none opacity-50" : undefined
						}
						href={nextHref}
					/>
				</PaginationItem>
			</PaginationContent>
		</ShadcnPagination>
	);
}
