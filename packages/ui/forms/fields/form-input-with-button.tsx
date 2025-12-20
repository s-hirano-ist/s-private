import { type ComponentProps, type RefObject, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useFormValues } from "../generic-form-wrapper";

/** FormInputWithButtonコンポーネントのProps */
export type FormInputWithButtonProps = {
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
	defaultValue,
	...inputProps
}: FormInputWithButtonProps) {
	const formValues = useFormValues();
	const preservedValue = formValues[inputProps.name || htmlFor];

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
