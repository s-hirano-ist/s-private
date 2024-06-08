"use client";
import { Button } from "@/components/ui/button";
import type { FC } from "react";
import { useFormStatus } from "react-dom";

type Props = {
	label: string;
};

export const SubmitButton: FC<Props> = ({ label }) => {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" disabled={pending}>
			{label}
		</Button>
	);
};
