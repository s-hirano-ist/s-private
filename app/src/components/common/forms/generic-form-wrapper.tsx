"use client";
import type { ServerAction } from "@/common/types";
import { Button } from "@s-hirano-ist/s-ui/button";
import { LoadingIndicator } from "@s-hirano-ist/s-ui/loading-indicator";
import { haptic } from "@s-hirano-ist/s-ui/utils/haptic";
import {
	createContext,
	type ReactNode,
	type SubmitEvent,
	use,
	useMemo,
	useRef,
	useState,
} from "react";
import { type CreateOutcome, useCreateFlow } from "./create-flow-context";

/**
 * Context for sharing form values across form fields.
 * @internal
 */
const FormValuesContext = createContext<Record<string, string>>({});
const FormFilesContext = createContext<FormData | null>(null);

/**
 * Hook to access form values from the GenericFormWrapper context.
 *
 * @remarks
 * Use this hook in form field components to access preserved form values
 * when a form submission fails and values need to be restored.
 *
 * @returns Record of field names to their preserved values
 *
 * @example
 * ```tsx
 * function MyFormField({ name }) {
 *   const formValues = useFormValues();
 *   const preservedValue = formValues[name];
 *   return <input defaultValue={preservedValue} name={name} />;
 * }
 * ```
 *
 * @see {@link GenericFormWrapper} for the provider component
 */
export const useFormValues = () => use(FormValuesContext);
export const useFormFiles = () => use(FormFilesContext);

function stringValues(formData: FormData | null | undefined) {
	const values: Record<string, string> = {};
	if (formData) {
		for (const [key, value] of formData.entries()) {
			if (typeof value === "string") values[key] = value;
		}
	}
	return values;
}

function addRetainedFiles(formData: FormData, draft?: FormData) {
	if (!draft) return;
	const names = new Set<string>();
	for (const [name, value] of draft.entries()) {
		if (value instanceof File && value.size > 0) names.add(name);
	}
	for (const name of names) {
		const currentFiles = formData
			.getAll(name)
			.filter(
				(value): value is File => value instanceof File && value.size > 0,
			);
		if (currentFiles.length > 0) continue;
		formData.delete(name);
		for (const value of draft.getAll(name)) {
			if (value instanceof File && value.size > 0) formData.append(name, value);
		}
	}
}

function formDataWithFiles(form: HTMLFormElement, draft?: FormData) {
	const formData = new FormData(form);
	for (const element of form.elements) {
		if (
			!(element instanceof HTMLInputElement) ||
			element.type !== "file" ||
			!element.name ||
			!element.files?.length
		)
			continue;
		formData.delete(element.name);
		for (const file of element.files) formData.append(element.name, file);
	}
	addRetainedFiles(formData, draft);
	return formData;
}

/**
 * Props for the GenericFormWrapper component.
 *
 * @typeParam T - The response type from the form action
 *
 * @see {@link GenericFormWrapper} for the component
 */
export type GenericFormWrapperProps<T extends ServerAction> = {
	/** Server action to handle form submission */
	action: (formData: FormData) => Promise<T>;
	/** Callback after form submission with its result */
	afterSubmit: (response: ServerAction) => void;
	/** Form field components */
	children: ReactNode;
	/** Label shown during loading state */
	loadingLabel?: string;
	/** Optional custom submit handler */
	onSubmit?: (formData: FormData) => Promise<CreateOutcome>;
	/** Pre-filled form values */
	preservedValues?: Record<string, string>;
	/** Label for the save button (fallback) */
	saveLabel: string;
	/** Label for the submit button */
	submitLabel?: string;
};

/**
 * A generic form wrapper with server action integration.
 *
 * @remarks
 * Provides a consistent form experience with:
 * - Server action integration with a persistent create flow when available
 * - Loading state with spinner
 * - Form value preservation on error
 * - Context-based form state sharing
 *
 * @typeParam T - Response type with `message` and `success` properties
 * @param props - Form wrapper configuration
 * @returns A form with submit handling and loading states
 *
 * @example
 * ```tsx
 * <GenericFormWrapper
 *   action={createArticle}
 *   saveLabel="Save"
 *   submitLabel="Create Article"
 *   afterSubmit={(response) => toast(response.message)}
 * >
 *   <FormInput label="Title" htmlFor="title" name="title" />
 *   <FormTextarea label="Content" htmlFor="content" name="content" />
 * </GenericFormWrapper>
 * ```
 *
 * @see {@link useFormValues} for accessing form state in child components
 */
export function GenericFormWrapper<T extends ServerAction>({
	action,
	children,
	saveLabel,
	submitLabel,
	loadingLabel,
	onSubmit,
	preservedValues,
	afterSubmit,
}: GenericFormWrapperProps<T>) {
	const createFlow = useCreateFlow();
	const submitting = useRef(false);
	const [isPending, setIsPending] = useState(false);
	// Server response form data (only set on error, cleared on success)
	const [serverFormData, setServerFormData] = useState<Record<
		string,
		string
	> | null>(null);

	// Derive form values: server response takes precedence, then preserved values
	const formValues = useMemo(
		() =>
			serverFormData ??
			(createFlow?.draft
				? stringValues(createFlow.draft)
				: (preservedValues ?? {})),
		[serverFormData, createFlow, preservedValues],
	);

	const execute = async (formData: FormData): Promise<CreateOutcome> => {
		if (onSubmit) return onSubmit(formData);
		return { response: await action(formData) };
	};

	const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (submitting.current || createFlow?.pending) return;
		submitting.current = true;
		const formData = formDataWithFiles(event.currentTarget, createFlow?.draft);
		if (createFlow) {
			createFlow.submit(formData, execute, afterSubmit);
			submitting.current = false;
			return;
		}
		setIsPending(true);
		void (async () => {
			try {
				const { response } = await execute(formData);
				afterSubmit(response);
				setServerFormData(
					response.success
						? null
						: (response.formData ?? stringValues(formData)),
				);
			} catch {
				afterSubmit({ success: false, message: "error" });
				setServerFormData(stringValues(formData));
			} finally {
				submitting.current = false;
				setIsPending(false);
			}
		})();
	};

	let buttonLabel: string;
	if (isPending && loadingLabel) {
		buttonLabel = loadingLabel;
	} else if (submitLabel) {
		buttonLabel = submitLabel;
	} else {
		buttonLabel = saveLabel;
	}

	return (
		<FormValuesContext.Provider value={formValues}>
			<FormFilesContext.Provider value={createFlow?.draft ?? null}>
				<form
					className="space-y-4 px-2 py-4"
					key={createFlow?.draftVersion}
					onSubmit={handleSubmit}
				>
					{isPending ? <LoadingIndicator label={loadingLabel} /> : children}
					<Button
						className="w-full"
						disabled={isPending}
						onClick={() => haptic()}
						type="submit"
					>
						{buttonLabel}
					</Button>
				</form>
			</FormFilesContext.Provider>
		</FormValuesContext.Provider>
	);
}
