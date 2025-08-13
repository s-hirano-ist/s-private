"use client";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { toast } from "sonner";
import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
	addBooks: (formData: FormData) => Promise<{ message: string }>;
};

export function AddBooksFormClient({ addBooks }: Props) {
	const label = useTranslations("label");
	const message = useTranslations("message");

	const submitForm = async (_: null, formData: FormData) => {
		const response = await addBooks(formData);
		toast(message(response.message));
		return null;
	};

	const [_, addBooksAction, isPending] = useActionState(submitForm, null);

	return (
		<form action={addBooksAction} className="space-y-4 px-2 py-4">
			{isPending ? (
				<Loading />
			) : (
				<>
					<div className="space-y-1">
						<Label htmlFor="isbn">ISBN</Label>
						<Input
							autoComplete="off"
							id="isbn"
							name="isbn"
							placeholder="978-4-XXXX-XXXX-X"
							required
						/>
					</div>
					<div className="space-y-1">
						<Label htmlFor="title">{label("title")}</Label>
						<Input autoComplete="off" id="title" name="title" required />
					</div>
				</>
			)}
			<Button className="w-full" disabled={isPending} type="submit">
				{label("save")}
			</Button>
		</form>
	);
}
