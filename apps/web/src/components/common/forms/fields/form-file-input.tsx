import type { ComponentProps } from "react";
import { useFormFiles } from "@/components/common/forms/generic-form-wrapper";
import { Input } from "@s-hirano-ist/s-ui/input";
import { Label } from "@s-hirano-ist/s-ui/label";

/**
 * Props for the FormFileInput component.
 *
 * @see {@link FormFileInput} for the component
 */
export type FormFileInputProps = {
	/** The HTML id for the input element */
	htmlFor: string;
	/** The label text displayed above the file input */
	label: string;
} & ComponentProps<typeof Input>;

/**
 * A labeled file input component for forms.
 *
 * @remarks
 * Provides a styled file upload field.
 * A create flow shows retained file names and resubmits the retained File objects.
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
	const retainedData = useFormFiles();
	const retainedFiles =
		retainedData
			?.getAll(inputProps.name ?? htmlFor)
			.filter(
				(value): value is File => value instanceof File && value.size > 0,
			) ?? [];
	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<Input
				id={htmlFor}
				type="file"
				{...inputProps}
				required={inputProps.required && retainedFiles.length === 0}
			/>
			{retainedFiles.length > 0 && (
				<p aria-live="polite" className="text-sm text-muted-foreground">
					{retainedFiles.map((file) => file.name).join(", ")}
				</p>
			)}
		</div>
	);
}
