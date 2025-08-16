import { useTranslations } from "next-intl";
import { PAGE_SIZE } from "@/common/constants";
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
	itemsPerPage?: number;
	label: string;
	badgeOnly?: boolean;
};

export function BadgeWithPagination({
	currentPage,
	totalItems,
	itemsPerPage = PAGE_SIZE,
	label,
	badgeOnly = false,
}: Props) {
	const t = useTranslations("label");

	if (badgeOnly) {
		return (
			<div className="px-2">
				<Badge className="m-2 flex justify-center">
					{t(label)}: {totalItems}
				</Badge>
			</div>
		);
	}

	const totalPages = Math.ceil(totalItems / itemsPerPage);

	const isPreviousDisabled = currentPage <= 1;
	const isNextDisabled = currentPage >= totalPages;

	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	return (
		<ShadcnPagination className="w-full px-4">
			<PaginationContent className="w-full justify-between">
				<PaginationItem>
					<PaginationPrevious
						className={
							isPreviousDisabled ? "pointer-events-none opacity-50" : undefined
						}
						href={isPreviousDisabled ? "#" : `?page=${currentPage - 1}`}
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
						href={isNextDisabled ? "#" : `?page=${currentPage + 1}`}
					/>
				</PaginationItem>
			</PaginationContent>
		</ShadcnPagination>
	);
}
