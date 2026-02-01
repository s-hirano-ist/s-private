"use client";
import {
	createContext,
	type ReactNode,
	use,
	useActionState,
	useState,
} from "react";
import Loading from "../display/loading";
import { Button } from "../ui/button";

/**
 * Context for sharing form values across form fields.
 * @internal
 */
const FormValuesContext = createContext<Record<string, string>>({});

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

/**
 * Props for the GenericFormWrapper component.
 *
 * @typeParam T - The response type from the form action
 *
 * @see {@link GenericFormWrapper} for the component
 */
export type GenericFormWrapperProps<T> = {
	/** Server action to handle form submission */
	action: (formData: FormData) => Promise<T>;
	/** Form field components */
	children: ReactNode;
	/** Label for the save button (fallback) */
	saveLabel: string;
	/** Label for the submit button */
	submitLabel?: string;
	/** Label shown during loading state */
	loadingLabel?: string;
	/** Optional custom submit handler */
	onSubmit?: (formData: FormData) => Promise<void>;
	/** Pre-filled form values */
	preservedValues?: Record<string, string>;
	/** Callback after form submission with response message */
	afterSubmit: (responseMessage: string) => void;
};

/**
 * A generic form wrapper with server action integration.
 *
 * @remarks
 * Provides a consistent form experience with:
 * - Server action integration via useActionState
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
 *   afterSubmit={(msg) => toast(msg)}
 * >
 *   <FormInput label="Title" htmlFor="title" name="title" />
 *   <FormTextarea label="Content" htmlFor="content" name="content" />
 * </GenericFormWrapper>
 * ```
 *
 * @see {@link useFormValues} for accessing form state in child components
 */
export function GenericFormWrapper<
	T extends { message: string; success: boolean },
>({
	action,
	children,
	saveLabel,
	submitLabel,
	loadingLabel,
	onSubmit,
	preservedValues,
	afterSubmit,
}: GenericFormWrapperProps<T>) {
	const [formValues, setFormValues] = useState<Record<string, string>>(
		preservedValues || {},
	);
	const [prevPreservedValues, setPrevPreservedValues] =
		useState(preservedValues);

	// Sync preservedValues to formValues during render (not in useEffect)
	if (preservedValues !== prevPreservedValues) {
		setPrevPreservedValues(preservedValues);
		if (preservedValues) {
			setFormValues(preservedValues);
		}
	}

	const submitForm = async (
		_previousState: T | null,
		formData: FormData,
	): Promise<T | null> => {
		if (onSubmit) {
			await onSubmit(formData);
			return null;
		}
		const response = await action(formData);
		afterSubmit(response.message);

		if (response.success) {
			// Clear form on success
			setFormValues({});
			return response;
		}
		// Preserve form data on error
		if ("formData" in response && response.formData) {
			setFormValues(response.formData as Record<string, string>);
		}
		return response;
	};

	const [_, submitAction, isPending] = useActionState(submitForm, null);

	return (
		<FormValuesContext.Provider value={formValues}>
			<form action={submitAction} className="space-y-4 px-2 py-4">
				{isPending ? <Loading /> : children}
				<Button className="w-full" disabled={isPending} type="submit">
					{isPending && loadingLabel
						? loadingLabel
						: submitLabel
							? submitLabel
							: saveLabel}
				</Button>
			</form>
		</FormValuesContext.Provider>
	);
}
