import { type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
	label: string;
	htmlFor: string;
} & ComponentProps<typeof Input>;

export function FormInput({ label, htmlFor, ...inputProps }: Props) {
	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<Input id={htmlFor} {...inputProps} />
		</div>
	);
}
