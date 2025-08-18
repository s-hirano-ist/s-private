import type { ComponentProps } from "react";
import { Label } from "@/components/common/ui/label";
import { Textarea } from "@/components/common/ui/textarea";
import { useFormValues } from "../generic-form-wrapper";

type Props = {
	label: string;
	htmlFor: string;
} & ComponentProps<typeof Textarea>;

export function FormTextarea({
	label,
	htmlFor,
	defaultValue,
	...textareaProps
}: Props) {
	const formValues = useFormValues();
	const preservedValue = formValues[textareaProps.name || htmlFor];

	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<Textarea
				defaultValue={preservedValue || defaultValue}
				id={htmlFor}
				{...textareaProps}
			/>
		</div>
	);
}
