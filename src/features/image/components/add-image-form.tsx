"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addImage } from "@/features/image/actions/add-image";
import { useToast } from "@/hooks/use-toast";
import { useActionState } from "react";

export function AddImageForm() {
	const { toast } = useToast();

	async function submitForm(_: null, formData: FormData) {
		const response = await addImage(formData);
		if (!response.success) {
			toast({
				variant: "destructive",
				description: response.message,
			});
		}
		return null;
	}

	const [_, addNewsAction, isPending] = useActionState(submitForm, null);

	return (
		<form action={addNewsAction} className="space-y-4 px-2 py-4">
			<div className="space-y-1">
				<Label htmlFor="file">画像</Label>
				<Input type="file" name="file" accept="image/*" required />
			</div>
			<Button type="submit" disabled={isPending} className="w-full">
				アップロード
			</Button>
		</form>
	);
}
