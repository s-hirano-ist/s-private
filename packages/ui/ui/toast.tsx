"use client";

import type { ReactNode } from "react";
import { Toast } from "@base-ui/react/toast";
import { CircleCheckIcon, CircleXIcon, XIcon } from "lucide-react";

type ToastType = "default" | "error" | "success";

const toastManager = Toast.createToastManager();

function addToast(title: ReactNode, type: ToastType = "default"): string {
	return toastManager.add({ title, type });
}

export const toast = Object.assign(addToast, {
	error: (title: ReactNode) => addToast(title, "error"),
	success: (title: ReactNode) => addToast(title, "success"),
});

function ToastIcon({ type }: { type?: string }) {
	if (type === "error") {
		return <CircleXIcon className="size-5 shrink-0 text-destructive" />;
	}

	if (type === "success") {
		return <CircleCheckIcon className="size-5 shrink-0 text-green-600" />;
	}

	return null;
}

function ToastList() {
	const { toasts } = Toast.useToastManager();

	return toasts.map((toastItem) => (
		<Toast.Root
			className="pointer-events-auto absolute right-0 bottom-0 flex w-full origin-bottom [transform:translateY(calc(var(--toast-offset-y)*-1))] items-start gap-3 rounded-md border bg-background p-4 text-primary shadow-lg transition-[transform,opacity] duration-200 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0 sm:w-96"
			key={toastItem.id}
			swipeDirection={["left", "right"]}
			toast={toastItem}
		>
			<ToastIcon type={toastItem.type} />
			<Toast.Content className="min-w-0 flex-1">
				<Toast.Title className="text-sm font-medium" />
			</Toast.Content>
			<Toast.Close
				aria-label="Dismiss notification"
				className="focus-visible:ring-ring rounded-sm text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
			>
				<XIcon className="size-4" />
			</Toast.Close>
		</Toast.Root>
	));
}

export function Toaster() {
	return (
		<Toast.Provider limit={3} timeout={2000} toastManager={toastManager}>
			<Toast.Portal>
				<Toast.Viewport className="pointer-events-none fixed right-4 bottom-4 z-[100] h-[var(--toast-frontmost-height)] w-[calc(100%_-_2rem)] outline-none sm:w-96">
					<ToastList />
				</Toast.Viewport>
			</Toast.Portal>
		</Toast.Provider>
	);
}
