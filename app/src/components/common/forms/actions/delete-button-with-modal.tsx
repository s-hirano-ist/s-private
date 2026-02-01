"use client";
import { Button } from "@s-hirano-ist/s-ui/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@s-hirano-ist/s-ui/ui/dialog";
import { TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useReducer } from "react";
import { toast } from "sonner";
import type { DeleteAction } from "@/common/types";

type Props = {
	deleteAction: DeleteAction;
	id: string;
	title: string;
};

type ModalState =
	| { status: "closed" }
	| { status: "open" }
	| { status: "deleting" };

type ModalAction =
	| { type: "OPEN" }
	| { type: "CLOSE" }
	| { type: "START_DELETE" }
	| { type: "DELETE_COMPLETE" }
	| { type: "DELETE_ERROR" };

function modalReducer(state: ModalState, action: ModalAction): ModalState {
	switch (action.type) {
		case "OPEN":
			return { status: "open" };
		case "CLOSE":
			// Can't close while deleting
			if (state.status === "deleting") return state;
			return { status: "closed" };
		case "START_DELETE":
			return { status: "deleting" };
		case "DELETE_COMPLETE":
			return { status: "closed" };
		case "DELETE_ERROR":
			return { status: "open" };
		default:
			return state;
	}
}

export function DeleteButtonWithModal({ id, title, deleteAction }: Props) {
	const [state, dispatch] = useReducer(modalReducer, { status: "closed" });

	const label = useTranslations("label");
	const message = useTranslations("message");

	const isOpen = state.status !== "closed";
	const isDeleting = state.status === "deleting";

	const handleDelete = async () => {
		try {
			dispatch({ type: "START_DELETE" });
			const response = await deleteAction(id);
			toast(message(response.message));
			dispatch({ type: "DELETE_COMPLETE" });
		} catch {
			toast.error(message("error"));
			dispatch({ type: "DELETE_ERROR" });
		}
	};

	const handleOpenChange = (open: boolean) => {
		dispatch({ type: open ? "OPEN" : "CLOSE" });
	};

	return (
		<>
			<Button
				className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
				onClickCapture={(e) => {
					e.preventDefault();
					e.stopPropagation();
					dispatch({ type: "OPEN" });
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
							onClick={() => dispatch({ type: "CLOSE" })}
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
