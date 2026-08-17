"use client";

import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { type RefObject, useState } from "react";
import { buttonVariants } from "../../ui/button";
import { cn } from "../../utils/cn";
import { haptic } from "../../utils/haptic";
import { useFormValues } from "../generic-form-wrapper";

export type Props = {
	customValueLabel?: (value: string) => string;
	disabled?: boolean;
	emptyMessage?: string;
	htmlFor: string;
	inputRef?: RefObject<HTMLInputElement | null>;
	label: string;
	name?: string;
	options: { id: string; name: string }[];
	placeholder: string;
	required?: boolean;
	searchPlaceholder?: string;
};

type DropdownItem = {
	creatable?: boolean;
	id: string;
	name: string;
};

const DEFAULT_EMPTY_MESSAGE = "No results found";
const DEFAULT_SEARCH_PLACEHOLDER = "Search...";
const DEFAULT_CUSTOM_VALUE_LABEL = (value: string) => `Use "${value}"`;

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
	// Runtime-driven keys may be absent even though the context's index signature
	// declares string values.
	const preservedValue = formValues[fieldName] as string | undefined;
	const [value, setValue] = useState(() => preservedValue ?? "");
	const [prevPreservedValue, setPrevPreservedValue] = useState(preservedValue);

	if (preservedValue !== prevPreservedValue) {
		setPrevPreservedValue(preservedValue);
		if (preservedValue !== undefined) setValue(preservedValue);
	}

	const trimmedSearchValue = searchValue.trim();
	const hasExactMatch = options.some(
		(option) =>
			option.name.trim().toLocaleLowerCase() ===
			trimmedSearchValue.toLocaleLowerCase(),
	);
	const items: DropdownItem[] =
		trimmedSearchValue && !hasExactMatch
			? [
					...options,
					{
						creatable: true,
						id: `create:${trimmedSearchValue.toLocaleLowerCase()}`,
						name: trimmedSearchValue,
					},
				]
			: options;
	const selectedItem = value
		? (options.find((option) => option.name === value) ?? {
				id: `selected:${value}`,
				name: value,
			})
		: null;

	const handleValueChange = (item: DropdownItem | null) => {
		if (!item) return;
		haptic();
		setValue(item.name);
		setSearchValue("");
		setOpen(false);
	};

	return (
		<div className="space-y-1">
			<Combobox.Root
				disabled={disabled}
				inputValue={searchValue}
				isItemEqualToValue={(item, selected) => item.name === selected.name}
				itemToStringLabel={(item) => item.name}
				items={items}
				onInputValueChange={setSearchValue}
				onOpenChange={setOpen}
				onValueChange={handleValueChange}
				open={open}
				value={selectedItem}
			>
				<Combobox.Label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
					{label}
				</Combobox.Label>
				<Combobox.Trigger
					aria-label={label}
					className={cn(
						buttonVariants({ variant: "outline" }),
						"w-full justify-between",
					)}
				>
					<Combobox.Value placeholder={placeholder} />
					<Combobox.Icon>
						<ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
					</Combobox.Icon>
				</Combobox.Trigger>
				<Combobox.Portal>
					<Combobox.Positioner align="start" sideOffset={4}>
						<Combobox.Popup
							aria-label={label}
							className="z-50 w-[var(--anchor-width)] rounded-md border border-muted bg-background text-foreground shadow-md transition-[opacity,transform] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
						>
							<Combobox.Input
								className="flex h-10 w-full rounded-md bg-transparent px-4 py-3 text-base outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
								placeholder={searchPlaceholder}
							/>
							<Combobox.Empty className="py-6 text-center text-sm">
								{emptyMessage}
							</Combobox.Empty>
							<Combobox.List className="max-h-75 scroll-py-1 overflow-x-hidden overflow-y-auto p-1">
								{(item: DropdownItem) => (
									<Combobox.Item
										className="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-muted data-highlighted:text-foreground"
										key={item.id}
										value={item}
									>
										{item.creatable ? (
											<PlusIcon className="size-4 shrink-0" />
										) : (
											<Combobox.ItemIndicator>
												<CheckIcon className="size-4 shrink-0" />
											</Combobox.ItemIndicator>
										)}
										{item.creatable ? customValueLabel(item.name) : item.name}
									</Combobox.Item>
								)}
							</Combobox.List>
						</Combobox.Popup>
					</Combobox.Positioner>
				</Combobox.Portal>
			</Combobox.Root>
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
