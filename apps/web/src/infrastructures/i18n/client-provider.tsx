"use client";

import type { AbstractIntlMessages } from "next-intl";
import type { ReactNode } from "react";
import { IntlErrorCode, NextIntlClientProvider } from "next-intl";

type Props = {
	children: ReactNode;
	locale: string;
	messages: AbstractIntlMessages;
};

function getGenericMessage(messages: AbstractIntlMessages): string {
	const messageNamespace = messages.message;

	if (messageNamespace && typeof messageNamespace === "object") {
		const errorMessage = messageNamespace.error;

		if (typeof errorMessage === "string") {
			return errorMessage;
		}
	}

	return "An error occurred.";
}

export function IntlClientProvider({ children, locale, messages }: Props) {
	const genericMessage = getGenericMessage(messages);

	return (
		<NextIntlClientProvider
			getMessageFallback={({ error, key, namespace }) => {
				if (
					error.code === IntlErrorCode.MISSING_MESSAGE &&
					namespace === "message"
				) {
					return genericMessage;
				}

				return namespace ? `${namespace}.${key}` : key;
			}}
			locale={locale}
			messages={messages}
			timeZone="Asia/Tokyo"
		>
			{children}
		</NextIntlClientProvider>
	);
}
