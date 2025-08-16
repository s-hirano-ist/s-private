import { type ComponentProps, type RefObject, useEffect } from "react";
import { Button } from "@/common/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { useFormValues } from "../generic-form-wrapper";

type Props = {
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
}: Props) {
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
