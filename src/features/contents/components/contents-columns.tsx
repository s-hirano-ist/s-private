import { Button } from "@/components/ui/button";
import type { ContentsAtom } from "@/features/contents/stores/contents-atom";
import { sanitizeHref } from "@/utils/sanitize-href";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Link as LinkIcon } from "lucide-react";
import type { Route } from "next";
import { Link } from "next-view-transitions";

export const contentsColumns = (): ColumnDef<ContentsAtom>[] => [
	{
		accessorKey: "id",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					ID
					<ArrowUpDown className="ml-2 size-4" />
				</Button>
			);
		},
		cell: ({ row }) => <div className="capitalize">{row.getValue("id")}</div>,
	},
	{
		accessorKey: "status",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Status
					<ArrowUpDown className="ml-2 size-4" />
				</Button>
			);
		},
		cell: ({ row }) => (
			<div className="capitalize">{row.getValue("status")}</div>
		),
	},
	{
		accessorKey: "title",
		header: "タイトル",
		cell: ({ row }) => {
			return <div className="font-bold">{row.getValue("title")}</div>;
		},
	},
	{
		accessorKey: "url",
		header: () => <></>,
		cell: ({ row }) => {
			return (
				<Link href={sanitizeHref(row.getValue("url")) as Route} target="_blank">
					<LinkIcon />
				</Link>
			);
		},
	},
];
