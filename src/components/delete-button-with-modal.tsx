"use client";
import { TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ServerAction } from "@/types";

type Props = {
	deleteAction: (id: string) => Promise<ServerAction<string>>;
	id: string;
	title: string;
};

export function DeleteButtonWithModal({ id, title, deleteAction }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const label = useTranslations("label");
	const message = useTranslations("message");

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			const response = await deleteAction(id);
			toast(message(response.message));
			setIsOpen(false);
		} catch {
			toast.error(message("error"));
		} finally {
			setIsDeleting(false);
		}
	};

	const handleOpenChange = (open: boolean) => {
		if (!isDeleting) {
			setIsOpen(open);
		}
	};

	return (
		<>
			<Button
				className="absolute right-2 top-2 text-destructive hover:bg-destructive/10"
				onClickCapture={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsOpen(true);
				}}
				size="icon"
				type="button"
				variant="ghost"
			>
				<TrashIcon className="size-4" />
			</Button>

			<Dialog onOpenChange={handleOpenChange} open={isOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{label("confirmDelete")}</DialogTitle>
						<DialogDescription>{title}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							disabled={isDeleting}
							onClick={() => setIsOpen(false)}
							variant="outline"
						>
							{label("cancel")}
						</Button>
						<Button
							disabled={isDeleting}
							onClick={handleDelete}
							variant="destructive"
						>
							{label("delete")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
