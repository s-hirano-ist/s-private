"use client";

import type { RefObject } from "react";
import { useFormValues } from "@/components/common/forms/generic-form-wrapper";
import {
	ComboboxField,
	type ComboboxFieldProps,
} from "@s-hirano-ist/s-ui/combobox-field";

export type FormDropdownInputProps = {
	customValueLabel?: (value: string) => string;
	htmlFor: string;
	inputRef?: RefObject<HTMLInputElement | null>;
	label: string;
	name?: string;
	options: { id: string; name: string }[];
} & Omit<
	ComboboxFieldProps,
	| "customValueLabel"
	| "defaultValue"
	| "id"
	| "inputRef"
	| "label"
	| "name"
	| "options"
>;

export function FormDropdownInput({
	customValueLabel,
	htmlFor,
	inputRef,
	label,
	name = htmlFor,
	options,
	...props
}: FormDropdownInputProps) {
	const formValues = useFormValues();
	return (
		<ComboboxField
			customValueLabel={customValueLabel}
			defaultValue={formValues[name]}
			id={htmlFor}
			inputRef={inputRef}
			label={label}
			name={name}
			options={options.map((option) => ({
				label: option.name,
				value: option.name,
			}))}
			{...props}
		/>
	);
}
