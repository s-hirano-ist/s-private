import type { ComponentProps } from "react";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { useFormValues } from "../generic-form-wrapper";

/**
 * Props for the FormTextarea component.
 *
 * @see {@link FormTextarea} for the component
 */
export type FormTextareaProps = {
	/** The label text displayed above the textarea */
	label: string;
	/** The HTML id for the textarea element */
	htmlFor: string;
} & ComponentProps<typeof Textarea>;

/**
 * A labeled multi-line text input component for forms.
 *
 * @remarks
 * Integrates with GenericFormWrapper for form state preservation.
 * Automatically restores value on form errors.
 *
 * @param props - Textarea props including label and standard textarea attributes
 * @returns A labeled textarea field
 *
 * @example
 * ```tsx
 * <FormTextarea
 *   label="Description"
 *   htmlFor="description"
 *   name="description"
 *   rows={5}
 * />
 * ```
 *
 * @see {@link GenericFormWrapper} for form integration
 */
export function FormTextarea({
	label,
	htmlFor,
	defaultValue,
	...textareaProps
}: FormTextareaProps) {
	const formValues = useFormValues();
	const preservedValue = formValues[textareaProps.name || htmlFor];

	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<Textarea
				defaultValue={preservedValue || defaultValue}
				id={htmlFor}
				{...textareaProps}
			/>
		</div>
	);
}
