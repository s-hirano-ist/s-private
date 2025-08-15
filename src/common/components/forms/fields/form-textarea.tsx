import { type ComponentProps } from "react";
import { Label } from "@/common/components/ui/label";
import { Textarea } from "@/common/components/ui/textarea";

type Props = {
	label: string;
	htmlFor: string;
} & ComponentProps<typeof Textarea>;

export function FormTextarea({ label, htmlFor, ...textareaProps }: Props) {
	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<Textarea id={htmlFor} {...textareaProps} />
		</div>
	);
}
