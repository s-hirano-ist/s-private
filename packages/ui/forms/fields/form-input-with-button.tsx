import type { ComponentProps, RefObject } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useFormValues } from "../generic-form-wrapper";

/**
 * Props for the FormInputWithButton component.
 *
 * @see {@link FormInputWithButton} for the component
 */
export type FormInputWithButtonProps = {
	/** The label text displayed above the input */
	label: string;
	/** The HTML id for the input element */
	htmlFor: string;
	/** Icon or content for the action button */
	buttonIcon: React.ReactNode;
	/** Callback when the button is clicked */
	onButtonClick: () => void;
	/** Optional ref to access the input element */
	inputRef?: RefObject<HTMLInputElement | null>;
	/** Test id for the button element */
	buttonTestId?: string;
	/** Accessible label for the button (defaults to label) */
	buttonAriaLabel?: string;
} & Omit<ComponentProps<typeof Input>, "ref">;

/**
 * A text input with an adjacent action button.
 *
 * @remarks
 * Useful for inputs that need an associated action like:
 * - URL input with fetch button
 * - Search input with clear button
 * - Password input with visibility toggle
 *
 * Integrates with GenericFormWrapper for form state preservation.
 * Uses key-based re-mounting to sync preserved values without useEffect.
 *
 * @param props - Input and button configuration
 * @returns An input field with an action button
 *
 * @example
 * ```tsx
 * <FormInputWithButton
 *   label="URL"
 *   htmlFor="url"
 *   name="url"
 *   buttonIcon={<FetchIcon />}
 *   onButtonClick={handleFetch}
 *   placeholder="https://example.com"
 * />
 * ```
 *
 * @see {@link GenericFormWrapper} for form integration
 */
export function FormInputWithButton({
	label,
	htmlFor,
	buttonIcon,
	onButtonClick,
	inputRef,
	buttonTestId,
	buttonAriaLabel,
	defaultValue,
	...inputProps
}: FormInputWithButtonProps) {
	const formValues = useFormValues();
	const fieldName = inputProps.name || htmlFor;
	const preservedValue = formValues[fieldName];

	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<div className="flex">
				<Input
					defaultValue={preservedValue || defaultValue}
					id={htmlFor}
					// Key change forces re-mount when preservedValue changes,
					// ensuring defaultValue is applied without useEffect sync
					key={preservedValue}
					ref={inputRef}
					{...inputProps}
				/>
				<Button
					aria-label={buttonAriaLabel ?? label}
					data-testid={buttonTestId}
					onClick={onButtonClick}
					type="button"
					variant="ghost"
				>
					{buttonIcon}
				</Button>
			</div>
		</div>
	);
}
