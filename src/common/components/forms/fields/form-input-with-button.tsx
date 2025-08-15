import { type ComponentProps, type RefObject } from "react";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";

type Props = {
	label: string;
	htmlFor: string;
	buttonIcon: React.ReactNode;
	onButtonClick: () => void;
	inputRef?: RefObject<HTMLInputElement | null>;
	buttonTestId?: string;
} & Omit<ComponentProps<typeof Input>, "ref">;

export function FormInputWithButton({
	label,
	htmlFor,
	buttonIcon,
	onButtonClick,
	inputRef,
	buttonTestId,
	...inputProps
}: Props) {
	return (
		<div className="space-y-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<div className="flex">
				<Input id={htmlFor} ref={inputRef} {...inputProps} />
				<Button
					data-testid={buttonTestId}
					onClick={onButtonClick}
					type="button"
					variant="ghost"
				>
					{buttonIcon}
				</Button>
			</div>
		</div>
	);
}
