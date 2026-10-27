"use client";

import type { ServerAction } from "@/common/types";
import { createContext, use } from "react";

export type CreateDomain = "articles" | "books" | "images" | "notes";

export type CreateOutcome = {
	response: ServerAction;
	retryData?: FormData;
};

export type CreateFlow = {
	domain: CreateDomain;
	draft?: FormData;
	draftVersion: number;
	pending: boolean;
	submit: (
		formData: FormData,
		execute: (formData: FormData) => Promise<CreateOutcome>,
		afterSubmit: (response: ServerAction) => void,
	) => void;
};

export const CreateFlowContext = createContext<CreateFlow | null>(null);

export function useCreateFlow() {
	return use(CreateFlowContext);
}
