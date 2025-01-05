"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
		<Card className="m-2 mx-auto w-full">
			<CardHeader>
				<CardTitle>Image Uploader</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={addNewsAction} className="space-y-4">
					<Input type="file" name="file" accept="image/*" required />
					<Button type="submit" disabled={isPending} className="w-full">
						アップロード
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
