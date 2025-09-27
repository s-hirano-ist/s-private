"use client";
import { useTranslations } from "next-intl";
import {
	createContext,
	type ReactNode,
	useActionState,
	useContext,
	useEffect,
	useState,
} from "react";
import { toast } from "sonner";
import type { ServerAction } from "@/common/types";
import Loading from "@/components/common/display/loading";
import { Button } from "@/components/common/ui/button";

const FormValuesContext = createContext<Record<string, string>>({});

export const useFormValues = () => useContext(FormValuesContext);

type Props = {
	action: (formData: FormData) => Promise<ServerAction>;
	children: ReactNode;
	submitLabel?: string;
	loadingLabel?: string;
	onSubmit?: (formData: FormData) => Promise<void>;
	preservedValues?: Record<string, string>;
};

export function GenericFormWrapper({
	action,
	children,
	submitLabel,
	loadingLabel,
	onSubmit,
	preservedValues,
}: Props) {
	const label = useTranslations("label");
	const message = useTranslations("message");
	const [formValues, setFormValues] = useState<Record<string, string>>(
		preservedValues || {},
	);

	useEffect(() => {
		if (preservedValues) {
			setFormValues(preservedValues);
		}
	}, [preservedValues]);

	const submitForm = async (
		_previousState: ServerAction | null,
		formData: FormData,
	) => {
		if (onSubmit) {
			await onSubmit(formData);
			return null;
		}
		const response = await action(formData);
		toast(message(response.message));

		if (response.success) {
			// Clear form on success
			setFormValues({});
			return { success: true, message: response.message };
		}
		// Preserve form data on error
		if (response.formData) {
			setFormValues(response.formData);
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
						? label(loadingLabel)
						: submitLabel
							? label(submitLabel)
							: label("save")}
				</Button>
			</form>
		</FormValuesContext.Provider>
	);
}
