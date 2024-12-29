import { useFormStatus } from "react-dom";
import { Button } from "./ui/button";

type Props = {
	label: string;
};

export function SubmitButton({ label }: Props) {
	// TODO: refactoring: add data, method, and action
	const { pending } = useFormStatus();

	return (
		<Button type="submit" disabled={pending} className="w-full">
			{label}
		</Button>
	);
}
