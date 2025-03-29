import {
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	Pagination as ShadcnPagination,
} from "@/components/ui/pagination";
import { PAGE_SIZE } from "@/constants";

type Props = { currentPage: number; totalPages: number };

export function Pagination({ currentPage, totalPages }: Props) {
	const showPreviousPageLink = 1 < currentPage;
	const showNextPageLink = currentPage < totalPages / PAGE_SIZE;

	return (
		<ShadcnPagination>
			<PaginationContent>
				{showPreviousPageLink && (
					<PaginationItem>
						<PaginationPrevious
							href={`?page=${currentPage > 1 ? currentPage - 1 : 1}`}
						/>
					</PaginationItem>
				)}
				<PaginationItem>
					<PaginationLink href="#">{currentPage}</PaginationLink>
				</PaginationItem>
				{showNextPageLink && (
					<PaginationItem>
						<PaginationNext href={`?page=${currentPage + 1}`} />
					</PaginationItem>
				)}
			</PaginationContent>
		</ShadcnPagination>
	);
}
