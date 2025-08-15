"use client";
import { useTranslations } from "next-intl";
import { type ReactNode, useActionState } from "react";
import { toast } from "sonner";
import Loading from "@/common/components/loading";
import { Button } from "@/common/components/ui/button";

type Props = {
	action: (formData: FormData) => Promise<{ message: string }>;
	children: ReactNode;
	submitLabel?: string;
	loadingLabel?: string;
	onSubmit?: (formData: FormData) => Promise<void>;
};

export function GenericFormWrapper({
	action,
	children,
	submitLabel,
	loadingLabel,
	onSubmit,
}: Props) {
	const label = useTranslations("label");
	const message = useTranslations("message");

	const submitForm = async (_: null, formData: FormData) => {
		if (onSubmit) {
			await onSubmit(formData);
		} else {
			const response = await action(formData);
			toast(message(response.message));
		}
		return null;
	};

	const [_, submitAction, isPending] = useActionState(submitForm, null);

	return (
		<form action={submitAction} className="space-y-4 px-2 py-4">
			{isPending ? <Loading /> : children}
			<Button className="w-full" disabled={isPending} type="submit">
				{isPending && loadingLabel
					? label(loadingLabel)
					: submitLabel
						? label(submitLabel)
						: label("save")}
			</Button>
		</form>
	);
}
