import type { ComponentProps } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useFormValues } from "../generic-form-wrapper";

/** FormInputコンポーネントのProps */
export type FormInputProps = {
	label: string;
	htmlFor: string;
} & ComponentProps<typeof Input>;

export function FormInput({
	label,
	htmlFor,
	defaultValue,
	...inputProps
}: FormInputProps) {
	const formValues = useFormValues();
	const preservedValue = formValues[inputProps.name || htmlFor];

	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<Input
				defaultValue={preservedValue || defaultValue}
				id={htmlFor}
				{...inputProps}
			/>
		</div>
	);
}
