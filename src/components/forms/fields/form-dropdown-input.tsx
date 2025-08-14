import { type ComponentProps, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
	...inputProps
}: Props) {
	const handleSelectedValueChange = (value: string) => {
		if (inputRef?.current) {
			inputRef.current.value = value;
		}
	};

	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<div className="flex">
				<Input id={htmlFor} ref={inputRef} {...inputProps} />
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
