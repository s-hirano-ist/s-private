"use client";

import type { ServerAction } from "@/common/types";
import { createContext, use } from "react";

export type CreateDomain = "articles" | "books" | "images" | "notes";

export type CreateOutcome = {
	response: ServerAction;
	retryData?: FormData;
};

export type CreateFlow = {
	discardDraft?: () => void;
	domain: CreateDomain;
	draft?: FormData;
	draftVersion: number;
	flushDraft?: () => void;
	pending: boolean;
	submit: (
		formData: FormData,
		execute: (formData: FormData) => Promise<CreateOutcome>,
		afterSubmit: (response: ServerAction) => void,
	) => void;
	updateDraft?: (data: FormData) => void;
};

export const CreateFlowContext = createContext<CreateFlow | null>(null);

export function useCreateFlow() {
	return use(CreateFlowContext);
}
