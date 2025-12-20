"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { type RefObject, useEffect, useState } from "react";
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

type Props = {
	label: string;
	htmlFor: string;
	options: { id: string; name: string }[];
	inputRef?: RefObject<HTMLInputElement | null>;
	placeholder?: string;
	name?: string;
	required?: boolean;
	disabled?: boolean;
	emptyMessage?: string;
	searchPlaceholder?: string;
	customValueLabel?: (value: string) => string;
};

export function FormDropdownInput({
	label,
	htmlFor,
	options,
	inputRef,
	placeholder,
	name,
	required,
	disabled,
	emptyMessage = "No results found",
	searchPlaceholder = "Search...",
	customValueLabel = (v) => `Use "${v}"`,
}: Props) {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState("");
	const [searchValue, setSearchValue] = useState("");

	const formValues = useFormValues();
	const preservedValue = formValues[name || htmlFor];

	useEffect(() => {
		if (preservedValue) {
			setValue(preservedValue);
		}
	}, [preservedValue]);

	useEffect(() => {
		if (inputRef?.current) {
			inputRef.current.value = value;
		}
	}, [value, inputRef]);

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
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						aria-expanded={open}
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
					<Command shouldFilter={true}>
						<CommandInput
							placeholder={searchPlaceholder}
							value={searchValue}
							onValueChange={setSearchValue}
							onKeyDown={(e) => {
								if (e.key === "Enter" && searchValue) {
									e.preventDefault();
									handleCustomValue();
								}
							}}
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
										value={option.name}
										onSelect={() => handleSelect(option.name)}
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
				name={name || htmlFor}
				ref={inputRef}
				required={required}
				type="hidden"
				value={value}
			/>
		</div>
	);
}
