"use client";
import type { ServerAction, ServerActionWithData } from "@/common/types";
import {
	pushBrowser,
	matchesPushKey,
	type PushBrowser,
} from "@/components/common/layouts/nav/push-browser";
import { PushSubscription as PushSubscriptionDto } from "@s-hirano-ist/s-api-client/models";
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
import { useRef, useState, useTransition } from "react";

export type PushStatus = {
	publicKey: string;
	registered: boolean;
	requiresResubscribe: boolean;
};
type PushAction = (
	endpoint: string,
) => Promise<ServerAction & { requiresResubscribe?: boolean }>;

export type PushNotificationButtonProps = {
	browser?: PushBrowser;
	getPushStatus: (
		endpoint?: string,
	) => Promise<ServerActionWithData<PushStatus>>;
	sendTestPush: PushAction;
	subscribeToPush: (subscription: PushSubscriptionDto) => Promise<ServerAction>;
	unsubscribeFromPush: PushAction;
};

type PushState =
	| "error"
	| "repair-required"
	| "save-required"
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

export function PushNotificationButton({
	getPushStatus,
	browser = pushBrowser,
	sendTestPush,
	subscribeToPush,
	unsubscribeFromPush,
}: PushNotificationButtonProps) {
	const t = useTranslations("utils");
	const [publicKey, setPublicKey] = useState("");
	const replacesEndpoint = useRef<string | null>(null);
	const version = useRef(0);
	const [open, setOpen] = useState(false);
	const [state, setState] = useState<PushState>("checking");
	const [subscription, setSubscription] = useState<PushSubscription | null>(
		null,
	);
	const [feedback, setFeedback] = useState("");
	const [isPending, startTransition] = useTransition();

	const refresh = () => {
		const requestVersion = ++version.current;
		setState("checking");
		setFeedback("");
		startTransition(async () => {
			try {
				const inspection = await browser.inspect();
				if (requestVersion !== version.current) return;
				setSubscription(inspection.subscription);
				if (inspection.state !== "checking") {
					setState(inspection.state);
					return;
				}
				const result = await getPushStatus(inspection.subscription?.endpoint);
				if (requestVersion !== version.current) return;
				if (!result.success || !result.data)
					throw new Error("Could not check notification settings");
				setPublicKey(result.data.publicKey);
				if (!inspection.subscription) {
					setState("unsubscribed");
					return;
				}
				if (
					result.data.requiresResubscribe ||
					!matchesPushKey(inspection.subscription, result.data.publicKey)
				) {
					setState("repair-required");
					return;
				}
				setState(result.data.registered ? "subscribed" : "save-required");
			} catch {
				if (requestVersion === version.current) {
					setState("error");
					setFeedback(t("pushError"));
				}
			}
		});
	};

	const enable = () => {
		haptic();
		setFeedback("");
		startTransition(async () => {
			let failureStage: PushFailureStage = "register";
			try {
				failureStage = "subscribe";
				const previous = state === "repair-required" ? subscription : null;
				if (previous) replacesEndpoint.current = previous.endpoint;
				const nextSubscription =
					state === "save-required" && subscription
						? subscription
						: await browser.subscribe(publicKey, previous);
				setSubscription(nextSubscription);
				setState("save-required");
				failureStage = "save";
				const result = await subscribeToPush(
					PushSubscriptionDto.parse({
						...nextSubscription.toJSON(),
						applicationServerKey: publicKey,
						replacesEndpoint: replacesEndpoint.current ?? undefined,
					}),
				);
				if (!result.success) throw new Error(result.message);
				setSubscription(nextSubscription);
				replacesEndpoint.current = null;
				setState("subscribed");
				setFeedback(t("pushSubscribed"));
			} catch (error) {
				captureException(error, {
					tags: {
						feature: "web-push",
						operation: "subscribe",
						stage: failureStage,
					},
				});
				if (failureStage === "subscribe") {
					const inspection = await browser.inspect().catch(() => null);
					if (inspection && inspection.state !== "checking") {
						setState(inspection.state);
					} else if (inspection && !inspection.subscription) {
						setSubscription(null);
						setState("unsubscribed");
					}
				}
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
			if (!(await subscription.unsubscribe())) {
				setFeedback(t("pushError"));
				return;
			}
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
			if (result.requiresResubscribe) setState("repair-required");
			setFeedback(t(result.success ? "pushTestSent" : "pushError"));
		});
	};

	const descriptions: Record<PushState, string> = {
		checking: t("pushChecking"),
		error: t("pushError"),
		"repair-required": t("pushResubscribeRequired"),
		"save-required": t("pushSaveRequired"),
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
					refresh();
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
			<Dialog
				onOpenChange={(value) => {
					setOpen(value);
					if (!value) version.current += 1;
				}}
				open={open}
			>
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
						{state === "error" ? (
							<Button disabled={isPending} onClick={refresh}>
								{t("pushRetry")}
							</Button>
						) : null}
						{state === "unsubscribed" ||
						state === "repair-required" ||
						state === "save-required" ? (
							<Button disabled={isPending} onClick={enable}>
								{t(state === "unsubscribed" ? "pushEnable" : "pushResubscribe")}
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
