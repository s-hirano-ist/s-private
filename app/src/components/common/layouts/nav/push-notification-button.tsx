"use client";
import type { BrowserPushSubscription } from "@/application-services/push-notifications/actions";
import type { ServerAction } from "@/common/types";
import { Button } from "@s-hirano-ist/s-ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@s-hirano-ist/s-ui/dialog";
import { haptic } from "@s-hirano-ist/s-ui/utils/haptic";
import { captureException } from "@sentry/nextjs";
import { Bell, BellOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

type PushAction = (endpoint: string) => Promise<ServerAction>;

export type PushNotificationButtonProps = {
	publicKey: string;
	sendTestPush: PushAction;
	subscribeToPush: (
		subscription: BrowserPushSubscription,
	) => Promise<ServerAction>;
	unsubscribeFromPush: PushAction;
};

type PushState =
	| "checking"
	| "denied"
	| "ios-install-required"
	| "subscribed"
	| "unsubscribed"
	| "unsupported";

type PushFailureStage = "register" | "save" | "subscribe";

export function feedbackKeyForFailure(
	stage: PushFailureStage,
): "pushRegistrationError" | "pushSaveError" | "pushSubscriptionError" {
	if (stage === "register") return "pushRegistrationError";
	if (stage === "subscribe") return "pushSubscriptionError";
	return "pushSaveError";
}

function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
	const padding = "=".repeat((4 - (value.length % 4)) % 4);
	const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
	const raw = window.atob(base64);
	return Uint8Array.from(raw, (character) => character.codePointAt(0) ?? 0);
}

function isIosOutsideStandalone(): boolean {
	const isIos = /iphone|ipad|ipod/iu.test(navigator.userAgent);
	const standalone =
		window.matchMedia("(display-mode: standalone)").matches ||
		("standalone" in navigator &&
			(navigator as Navigator & { standalone?: boolean }).standalone === true);
	return isIos && !standalone;
}

function getInitialState(publicKey: string): PushState {
	if (
		!publicKey ||
		!("serviceWorker" in navigator) ||
		!("PushManager" in window) ||
		!("Notification" in window)
	) {
		return "unsupported";
	}
	if (isIosOutsideStandalone()) return "ios-install-required";
	if (Notification.permission === "denied") return "denied";
	return "checking";
}

export function PushNotificationButton({
	publicKey,
	sendTestPush,
	subscribeToPush,
	unsubscribeFromPush,
}: PushNotificationButtonProps) {
	const t = useTranslations("utils");
	const [open, setOpen] = useState(false);
	const [state, setState] = useState<PushState>("checking");
	const [subscription, setSubscription] = useState<PushSubscription | null>(
		null,
	);
	const [feedback, setFeedback] = useState("");
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		let active = true;
		const syncSubscription = async () => {
			await Promise.resolve();
			const initialState = getInitialState(publicKey);
			if (!active) return;
			if (initialState !== "checking") {
				setState(initialState);
				return;
			}
			const registration = await navigator.serviceWorker.getRegistration("/");
			const current = await registration?.pushManager.getSubscription();
			// oxlint-disable-next-line typescript/no-unnecessary-condition -- effect cleanup can flip active while the browser promise is pending
			if (!active) return;
			setSubscription(current ?? null);
			setState(current ? "subscribed" : "unsubscribed");
		};
		void syncSubscription();
		return () => {
			active = false;
		};
	}, [publicKey]);

	const enable = () => {
		haptic();
		setFeedback("");
		startTransition(async () => {
			let failureStage: PushFailureStage = "register";
			try {
				const permission = await Notification.requestPermission();
				if (permission !== "granted") {
					setState("denied");
					return;
				}
				const registration = await navigator.serviceWorker.register(
					"/push-service-worker.js",
					{ scope: "/" },
				);
				await navigator.serviceWorker.ready;
				failureStage = "subscribe";
				const nextSubscription = await registration.pushManager.subscribe({
					applicationServerKey: base64UrlToUint8Array(publicKey),
					userVisibleOnly: true,
				});
				failureStage = "save";
				const result = await subscribeToPush(
					nextSubscription.toJSON() as BrowserPushSubscription,
				);
				if (!result.success) throw new Error(result.message);
				setSubscription(nextSubscription);
				setState("subscribed");
				setFeedback(t("pushSubscribed"));
			} catch (error) {
				captureException(error, {
					extra: { notificationPermission: Notification.permission },
					tags: {
						feature: "web-push",
						operation: "subscribe",
						stage: failureStage,
					},
				});
				setFeedback(t(feedbackKeyForFailure(failureStage)));
			}
		});
	};

	const disable = () => {
		if (!subscription) return;
		haptic();
		setFeedback("");
		startTransition(async () => {
			const result = await unsubscribeFromPush(subscription.endpoint);
			if (!result.success) {
				setFeedback(t("pushError"));
				return;
			}
			await subscription.unsubscribe();
			setSubscription(null);
			setState("unsubscribed");
			setFeedback(t("pushUnsubscribed"));
		});
	};

	const sendTest = () => {
		if (!subscription) return;
		haptic();
		setFeedback("");
		startTransition(async () => {
			const result = await sendTestPush(subscription.endpoint);
			setFeedback(t(result.success ? "pushTestSent" : "pushError"));
		});
	};

	const descriptions: Record<PushState, string> = {
		checking: t("pushChecking"),
		denied: t("pushDenied"),
		"ios-install-required": t("pushIosInstall"),
		subscribed: t("pushEnabled"),
		unsubscribed: t("pushDisabled"),
		unsupported: t("pushUnsupported"),
	};

	return (
		<>
			<Button
				aria-label={t("pushNotifications")}
				className="flex h-16 flex-col items-center gap-1"
				onClick={() => {
					haptic();
					setOpen(true);
				}}
				variant="outline"
			>
				{state === "subscribed" ? (
					<Bell className="size-5" />
				) : (
					<BellOff className="size-5" />
				)}
				<span className="text-xs">PUSH</span>
			</Button>
			<Dialog onOpenChange={setOpen} open={open}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("pushNotifications")}</DialogTitle>
						<DialogDescription>{descriptions[state]}</DialogDescription>
					</DialogHeader>
					{feedback ? (
						<p aria-live="polite" className="text-sm">
							{feedback}
						</p>
					) : null}
					<DialogFooter>
						{state === "unsubscribed" ? (
							<Button disabled={isPending} onClick={enable}>
								{t("pushEnable")}
							</Button>
						) : null}
						{state === "subscribed" ? (
							<>
								<Button
									disabled={isPending}
									onClick={disable}
									variant="outline"
								>
									{t("pushDisable")}
								</Button>
								<Button disabled={isPending} onClick={sendTest}>
									{t("pushTest")}
								</Button>
							</>
						) : null}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
