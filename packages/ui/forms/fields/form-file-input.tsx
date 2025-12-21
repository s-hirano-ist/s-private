import type { ComponentProps } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

/** FormFileInputコンポーネントのProps */
export type FormFileInputProps = {
	label: string;
	htmlFor: string;
} & ComponentProps<typeof Input>;

export function FormFileInput({
	label,
	htmlFor,
	...inputProps
}: FormFileInputProps) {
	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<Input id={htmlFor} type="file" {...inputProps} />
		</div>
	);
}
