"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { type RefObject, useState } from "react";
import { Button } from "../../ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "../../ui/command";
import { Label } from "../../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { cn } from "../../utils/cn";
import { useFormValues } from "../generic-form-wrapper";

/**
 * Props for the FormDropdownInput component.
 *
 * @remarks
 * This component provides a searchable dropdown with support for custom values.
 * It integrates with the generic form wrapper for form state management.
 *
 * @see {@link FormDropdownInput} for the component
 */
export type Props = {
	/** The label text displayed above the dropdown */
	label: string;
	/** The HTML id for the input element */
	htmlFor: string;
	/** Array of options with id and display name */
	options: { id: string; name: string }[];
	/** Optional ref to access the hidden input element */
	inputRef?: RefObject<HTMLInputElement | null>;
	/** Placeholder text when no value is selected */
	placeholder?: string;
	/** The form field name (defaults to htmlFor if not provided) */
	name?: string;
	/** Whether the field is required */
	required?: boolean;
	/** Whether the field is disabled */
	disabled?: boolean;
	/** Message shown when no options match the search */
	emptyMessage?: string;
	/** Placeholder text for the search input */
	searchPlaceholder?: string;
	/** Function to generate the label for custom values */
	customValueLabel?: (value: string) => string;
};

// Default values extracted as constants for stable reference
const DEFAULT_EMPTY_MESSAGE = "No results found";
const DEFAULT_SEARCH_PLACEHOLDER = "Search...";
const DEFAULT_CUSTOM_VALUE_LABEL = (v: string) => `Use "${v}"`;

/**
 * A searchable dropdown input component for forms.
 *
 * @remarks
 * Combines Popover and Command components for a combobox experience.
 * Supports:
 * - Searchable options
 * - Custom value entry
 * - Form state preservation via GenericFormWrapper
 * - Keyboard navigation
 *
 * **State Management Note:**
 * This component uses local state for the selected value because:
 * 1. The FormValuesContext is read-only (used for restoring values after form errors)
 * 2. User selections need immediate UI feedback
 * 3. The hidden input submits the current value to the form
 *
 * The prevPreservedValue pattern syncs context changes (e.g., after form error)
 * to local state during render, following React's recommended approach for
 * "adjusting state when props change".
 *
 * @param props - Dropdown configuration including options and labels
 * @returns A searchable dropdown field with hidden input for form submission
 *
 * @example
 * ```tsx
 * <FormDropdownInput
 *   label="Category"
 *   htmlFor="category"
 *   name="category"
 *   options={[
 *     { id: "1", name: "Technology" },
 *     { id: "2", name: "Business" },
 *   ]}
 *   placeholder="Select a category"
 * />
 * ```
 *
 * @see {@link GenericFormWrapper} for form integration
 */
export function FormDropdownInput({
	label,
	htmlFor,
	options,
	inputRef,
	placeholder,
	name,
	required,
	disabled,
	emptyMessage = DEFAULT_EMPTY_MESSAGE,
	searchPlaceholder = DEFAULT_SEARCH_PLACEHOLDER,
	customValueLabel = DEFAULT_CUSTOM_VALUE_LABEL,
}: Props) {
	const [open, setOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");

	const formValues = useFormValues();
	const fieldName = name || htmlFor;
	const preservedValue = formValues[fieldName];

	// Local state is necessary because FormValuesContext is read-only.
	// The context only provides values for restoration after form submission errors.
	const [value, setValue] = useState(() => preservedValue ?? "");
	const [prevPreservedValue, setPrevPreservedValue] = useState(preservedValue);

	// Sync context value to local state when context changes (e.g., after form error).
	// This follows React's pattern for adjusting state when props change.
	if (preservedValue !== prevPreservedValue) {
		setPrevPreservedValue(preservedValue);
		if (preservedValue !== undefined) {
			setValue(preservedValue);
		}
	}

	const handleSelect = (selectedValue: string) => {
		setValue(selectedValue);
		setSearchValue("");
		setOpen(false);
	};

	const handleCustomValue = () => {
		if (searchValue) {
			setValue(searchValue);
			setSearchValue("");
			setOpen(false);
		}
	};

	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger asChild>
					<Button
						aria-expanded={open}
						aria-label={label}
						className="w-full justify-between"
						disabled={disabled}
						role="combobox"
						variant="outline"
					>
						{value || placeholder || "Select..."}
						<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
					<Command shouldFilter>
						<CommandInput
							onKeyDown={(e) => {
								if (e.key === "Enter" && searchValue) {
									e.preventDefault();
									handleCustomValue();
								}
							}}
							onValueChange={setSearchValue}
							placeholder={searchPlaceholder}
							value={searchValue}
						/>
						<CommandList>
							<CommandEmpty>
								{searchValue ? (
									<button
										className="w-full text-left hover:underline"
										onClick={handleCustomValue}
										type="button"
									>
										{customValueLabel(searchValue)}
									</button>
								) : (
									emptyMessage
								)}
							</CommandEmpty>
							<CommandGroup>
								{options.map((option) => (
									<CommandItem
										key={option.id}
										onSelect={() => handleSelect(option.name)}
										value={option.name}
									>
										<CheckIcon
											className={cn(
												"mr-2 h-4 w-4",
												value === option.name ? "opacity-100" : "opacity-0",
											)}
										/>
										{option.name}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			<input
				id={htmlFor}
				name={fieldName}
				ref={inputRef}
				required={required}
				type="hidden"
				value={value}
			/>
		</div>
	);
}
