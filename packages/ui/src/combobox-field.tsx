"use client";

import { Combobox } from "@base-ui/react/combobox";
import CheckIcon from "lucide-react/dist/esm/icons/check.mjs";
import ChevronsUpDownIcon from "lucide-react/dist/esm/icons/chevrons-up-down.mjs";
import PlusIcon from "lucide-react/dist/esm/icons/plus.mjs";
import { type Ref, useState } from "react";
import { buttonVariants } from "./button.js";
import { cn } from "./utils/cn.js";

export type ComboboxFieldOption = {
	label: string;
	value: string;
};

type ComboboxItem = ComboboxFieldOption & { custom?: boolean };

const defaultCustomValueLabel = (value: string) => `Use “${value}”`;

export type ComboboxFieldProps = {
	allowCustomValue?: boolean;
	customValueLabel?: (value: string) => string;
	defaultValue?: string;
	disabled?: boolean;
	emptyMessage?: string;
	id: string;
	inputRef?: Ref<HTMLInputElement>;
	label: string;
	name?: string;
	onValueChange?: (value: string) => void;
	options: ComboboxFieldOption[];
	placeholder?: string;
	required?: boolean;
	searchPlaceholder?: string;
	value?: string;
};

export function ComboboxField({
	allowCustomValue = true,
	customValueLabel = defaultCustomValueLabel,
	defaultValue = "",
	disabled,
	emptyMessage = "No results found",
	id,
	inputRef,
	label,
	name = id,
	onValueChange,
	options,
	placeholder = "Select an option",
	required,
	searchPlaceholder = "Search…",
	value: controlledValue,
}: ComboboxFieldProps) {
	const [open, setOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
	const value = controlledValue ?? uncontrolledValue;
	const trimmedSearchValue = searchValue.trim();
	const hasExactMatch = options.some(
		(option) =>
			option.label.toLocaleLowerCase() ===
			trimmedSearchValue.toLocaleLowerCase(),
	);
	const items: ComboboxItem[] =
		allowCustomValue && trimmedSearchValue && !hasExactMatch
			? [
					...options,
					{
						custom: true,
						label: trimmedSearchValue,
						value: trimmedSearchValue,
					},
				]
			: options;
	const selectedItem = value
		? (options.find((option) => option.value === value) ?? {
				label: value,
				value,
			})
		: null;

	const handleValueChange = (item: ComboboxItem | null) => {
		if (!item) return;
		if (controlledValue === undefined) setUncontrolledValue(item.value);
		onValueChange?.(item.value);
		setSearchValue("");
		setOpen(false);
	};

	return (
		<div className="sui:space-y-1.5" data-slot="combobox-field">
			<Combobox.Root
				disabled={disabled}
				inputValue={searchValue}
				isItemEqualToValue={(item, selected) => item.value === selected.value}
				itemToStringLabel={(item) => item.label}
				items={items}
				onInputValueChange={setSearchValue}
				onOpenChange={setOpen}
				onValueChange={handleValueChange}
				open={open}
				value={selectedItem}
			>
				<Combobox.Label className="sui:text-sm sui:leading-none sui:font-medium">
					{label}
				</Combobox.Label>
				<Combobox.Trigger
					aria-label={label}
					className={cn(
						buttonVariants({ variant: "outline" }),
						"sui:w-full sui:justify-between",
					)}
				>
					<Combobox.Value placeholder={placeholder} />
					<Combobox.Icon>
						<ChevronsUpDownIcon
							aria-hidden="true"
							className="sui:ml-2 sui:size-4 sui:opacity-50"
						/>
					</Combobox.Icon>
				</Combobox.Trigger>
				<Combobox.Portal>
					<Combobox.Positioner align="start" sideOffset={4}>
						<Combobox.Popup className="sui:z-50 sui:w-[var(--anchor-width)] sui:rounded-md sui:border sui:border-muted sui:bg-background sui:text-foreground sui:shadow-md">
							<Combobox.Input
								className="sui:flex sui:h-10 sui:w-full sui:bg-transparent sui:px-4 sui:py-3 sui:outline-hidden sui:placeholder:text-muted-foreground"
								placeholder={searchPlaceholder}
							/>
							<Combobox.Empty className="sui:py-6 sui:text-center sui:text-sm">
								{emptyMessage}
							</Combobox.Empty>
							<Combobox.List className="sui:max-h-75 sui:overflow-y-auto sui:p-1">
								{(item: ComboboxItem) => (
									<Combobox.Item
										className="sui:relative sui:flex sui:items-center sui:gap-2 sui:rounded-sm sui:px-2 sui:py-1.5 sui:text-sm sui:data-highlighted:bg-muted"
										key={`${item.custom ? "custom" : "option"}:${item.value}`}
										value={item}
									>
										{item.custom ? (
											<PlusIcon aria-hidden="true" className="sui:size-4" />
										) : (
											<Combobox.ItemIndicator>
												<CheckIcon aria-hidden="true" className="sui:size-4" />
											</Combobox.ItemIndicator>
										)}
										{item.custom ? customValueLabel(item.label) : item.label}
									</Combobox.Item>
								)}
							</Combobox.List>
						</Combobox.Popup>
					</Combobox.Positioner>
				</Combobox.Portal>
			</Combobox.Root>
			<input
				id={id}
				name={name}
				ref={inputRef}
				required={required}
				type="hidden"
				value={value}
			/>
		</div>
	);
}
