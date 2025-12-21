import type { ComponentProps } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useFormValues } from "../generic-form-wrapper";

/**
 * Props for the FormInput component.
 *
 * @see {@link FormInput} for the component
 */
export type FormInputProps = {
	/** The label text displayed above the input */
	label: string;
	/** The HTML id for the input element */
	htmlFor: string;
} & ComponentProps<typeof Input>;

/**
 * A labeled text input component for forms.
 *
 * @remarks
 * Integrates with GenericFormWrapper for form state preservation.
 * Automatically restores value on form errors.
 *
 * @param props - Input props including label and standard input attributes
 * @returns A labeled input field
 *
 * @example
 * ```tsx
 * <FormInput
 *   label="Email"
 *   htmlFor="email"
 *   name="email"
 *   type="email"
 *   required
 * />
 * ```
 *
 * @see {@link GenericFormWrapper} for form integration
 */
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
