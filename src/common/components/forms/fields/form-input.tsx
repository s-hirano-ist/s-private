import { type ComponentProps } from "react";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { useFormValues } from "../generic-form-wrapper";

type Props = {
	label: string;
	htmlFor: string;
} & ComponentProps<typeof Input>;

export function FormInput({
	label,
	htmlFor,
	defaultValue,
	...inputProps
}: Props) {
	const formValues = useFormValues();
	const preservedValue = formValues[inputProps.name || htmlFor];

	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<Input
				defaultValue={preservedValue || defaultValue}
				id={htmlFor}
				{...inputProps}
			/>
		</div>
	);
}
