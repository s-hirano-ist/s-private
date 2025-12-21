"use client";
import {
	createContext,
	type ReactNode,
	useActionState,
	useContext,
	useEffect,
	useState,
} from "react";
import Loading from "../display/loading";
import { Button } from "../ui/button";

const FormValuesContext = createContext<Record<string, string>>({});

export const useFormValues = () => useContext(FormValuesContext);

/** GenericFormWrapperコンポーネントのProps */
export type GenericFormWrapperProps<T> = {
	action: (formData: FormData) => Promise<T>;
	children: ReactNode;
	saveLabel: string;
	submitLabel?: string;
	loadingLabel?: string;
	onSubmit?: (formData: FormData) => Promise<void>;
	preservedValues?: Record<string, string>;
	afterSubmit: (responseMessage: string) => void;
};

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

	useEffect(() => {
		if (preservedValues) {
			setFormValues(preservedValues);
		}
	}, [preservedValues]);

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
