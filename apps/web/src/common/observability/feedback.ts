import {
	getClient,
	addIntegration,
	feedbackIntegration,
	logger,
} from "@sentry/nextjs";

export type FeedbackLabels = {
	cancelButtonLabel: string;
	errorEmptyMessageText: string;
	errorGenericText: string;
	formTitle: string;
	isRequiredLabel: string;
	messageLabel: string;
	messagePlaceholder: string;
	submitButtonLabel: string;
	successMessageText: string;
};

/** The SDK receives only feedback deliberately entered in its form. */
export async function openFeedback(labels: FeedbackLabels) {
	if (!getClient()?.getOptions().enabled)
		throw new Error("Feedback unavailable");
	let integration =
		getClient()?.getIntegrationByName<ReturnType<typeof feedbackIntegration>>(
			"Feedback",
		);
	if (!integration) {
		integration = feedbackIntegration({
			autoInject: false,
			colorScheme: "system",
			showName: false,
			showEmail: false,
			isNameRequired: false,
			isEmailRequired: false,
			useSentryUser: { name: "", email: "" },
			enableScreenshot: false,
		});
		addIntegration(integration);
	}
	const form = await integration.createForm({
		...labels,
		errorNoClientText: labels.errorGenericText,
		errorTimeoutText: labels.errorGenericText,
		errorForbiddenText: labels.errorGenericText,
		onSubmitSuccess: () => {
			try {
				logger.info("Feedback submitted");
			} catch {
				/* Keep the submission result. */
			}
		},
		onSubmitError: () => {
			try {
				logger.warn("Feedback submission failed");
			} catch {
				/* Keep the SDK error UI. */
			}
		},
		onFormClose: () => form.removeFromDom(),
		onFormSubmitted: () => form.removeFromDom(),
	});
	form.appendToDom();
	form.open();
}
