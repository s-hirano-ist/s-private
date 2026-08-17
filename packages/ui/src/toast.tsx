"use client";

import { Toast } from "@base-ui/react/toast";
import CircleCheckIcon from "lucide-react/dist/esm/icons/circle-check.mjs";
import CircleXIcon from "lucide-react/dist/esm/icons/circle-x.mjs";
import XIcon from "lucide-react/dist/esm/icons/x.mjs";
import { createContext, type ReactNode, use, useMemo, useRef } from "react";

export type ToastType = "default" | "error" | "success";

export type ToastApi = {
	error: (title: ReactNode) => string;
	show: (title: ReactNode) => string;
	success: (title: ReactNode) => string;
};

const ToastContext = createContext<ToastApi | null>(null);

function ToastIcon({ type }: { type?: string }) {
	if (type === "error") {
		return (
			<CircleXIcon className="sui:size-5 sui:shrink-0 sui:text-destructive" />
		);
	}
	if (type === "success") {
		return (
			<CircleCheckIcon className="sui:size-5 sui:shrink-0 sui:text-green-600" />
		);
	}
	return null;
}

function ToastList({ dismissLabel }: { dismissLabel: string }) {
	const { toasts } = Toast.useToastManager();
	return toasts.map((toastItem) => (
		<Toast.Root
			className="sui:pointer-events-auto sui:absolute sui:right-0 sui:bottom-0 sui:flex sui:w-full sui:origin-bottom sui:items-start sui:gap-3 sui:rounded-md sui:border sui:bg-background sui:p-4 sui:text-primary sui:shadow-lg sui:transition-[transform,opacity] sui:duration-200 sui:[transform:translateY(calc(var(--toast-offset-y)*-1))] sui:data-[ending-style]:opacity-0 sui:data-[starting-style]:translate-y-2 sui:data-[starting-style]:opacity-0 sui:sm:w-96"
			key={toastItem.id}
			swipeDirection={["left", "right"]}
			toast={toastItem}
		>
			<ToastIcon type={toastItem.type} />
			<Toast.Content className="sui:min-w-0 sui:flex-1">
				<Toast.Title className="sui:text-sm sui:font-medium" />
			</Toast.Content>
			<Toast.Close
				aria-label={dismissLabel}
				className="sui:rounded-sm sui:text-muted-foreground sui:opacity-70 sui:transition-opacity sui:hover:opacity-100 sui:focus-visible:ring-2 sui:focus-visible:ring-primary sui:focus-visible:outline-none"
			>
				<XIcon aria-hidden="true" className="sui:size-4" />
			</Toast.Close>
		</Toast.Root>
	));
}

export type ToastProviderProps = {
	children: ReactNode;
	dismissLabel?: string;
	limit?: number;
	timeout?: number;
};

export function ToastProvider({
	children,
	dismissLabel = "Dismiss notification",
	limit = 3,
	timeout = 2000,
}: ToastProviderProps) {
	const managerRef = useRef<ReturnType<typeof Toast.createToastManager> | null>(
		null,
	);
	managerRef.current ??= Toast.createToastManager();
	const manager = managerRef.current;
	const api = useMemo<ToastApi>(
		() => ({
			show: (title) => manager.add({ title, type: "default" }),
			error: (title) => manager.add({ title, type: "error" }),
			success: (title) => manager.add({ title, type: "success" }),
		}),
		[manager],
	);

	return (
		<ToastContext value={api}>
			<Toast.Provider limit={limit} timeout={timeout} toastManager={manager}>
				{children}
				<Toast.Portal>
					<Toast.Viewport className="sui:pointer-events-none sui:fixed sui:right-4 sui:bottom-4 sui:z-[100] sui:h-[var(--toast-frontmost-height)] sui:w-[calc(100%_-_2rem)] sui:outline-none sui:sm:w-96">
						<ToastList dismissLabel={dismissLabel} />
					</Toast.Viewport>
				</Toast.Portal>
			</Toast.Provider>
		</ToastContext>
	);
}

export function useToast(): ToastApi {
	const api = use(ToastContext);
	if (!api) throw new Error("useToast must be used within ToastProvider");
	return api;
}
