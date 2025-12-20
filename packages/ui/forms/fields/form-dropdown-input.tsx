import { type ComponentProps, type RefObject, useEffect } from "react";
import { Button } from "../../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useFormValues } from "../generic-form-wrapper";

/** FormDropdownInputコンポーネントのProps */
export type FormDropdownInputProps = {
	label: string;
	htmlFor: string;
	options: { id: string; name: string }[];
	triggerIcon: React.ReactNode;
	inputRef?: RefObject<HTMLInputElement | null>;
} & Omit<ComponentProps<typeof Input>, "ref">;

export function FormDropdownInput({
	label,
	htmlFor,
	options,
	triggerIcon,
	inputRef,
	defaultValue,
	...inputProps
}: FormDropdownInputProps) {
	const formValues = useFormValues();
	const preservedValue = formValues[inputProps.name || htmlFor];

	const handleSelectedValueChange = (value: string) => {
		if (inputRef?.current) {
			inputRef.current.value = value;
		}
	};

	useEffect(() => {
		if (preservedValue && inputRef?.current) {
			inputRef.current.value = preservedValue;
		}
	}, [preservedValue, inputRef]);

	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<div className="flex">
				<Input
					defaultValue={preservedValue || defaultValue}
					id={htmlFor}
					ref={inputRef}
					{...inputProps}
				/>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost">{triggerIcon}</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{options.map((option) => (
							<DropdownMenuItem
								key={option.id}
								onClick={() => handleSelectedValueChange(option.name)}
								textValue={String(option.name)}
							>
								{option.name}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
