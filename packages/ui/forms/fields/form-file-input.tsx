import type { ComponentProps } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

/**
 * Props for the FormFileInput component.
 *
 * @see {@link FormFileInput} for the component
 */
export type FormFileInputProps = {
	/** The label text displayed above the file input */
	label: string;
	/** The HTML id for the input element */
	htmlFor: string;
} & ComponentProps<typeof Input>;

/**
 * A labeled file input component for forms.
 *
 * @remarks
 * Provides a styled file upload field.
 * Note: File inputs don't preserve values on form errors due to browser security.
 *
 * @param props - File input props including label and standard input attributes
 * @returns A labeled file input field
 *
 * @example
 * ```tsx
 * <FormFileInput
 *   label="Upload Image"
 *   htmlFor="image"
 *   name="image"
 *   accept="image/*"
 *   required
 * />
 * ```
 */
export function FormFileInput({
	label,
	htmlFor,
	...inputProps
}: FormFileInputProps) {
	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<Input id={htmlFor} type="file" {...inputProps} />
		</div>
	);
}
