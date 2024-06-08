"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function NewInput() {
	return (
		<div className="w-full space-y-2">
			<div className="space-y-1">
				<Label htmlFor="title">タイトル</Label>
				<Input id="title" name="title" required />
			</div>
			<div className="space-y-1">
				<Label htmlFor="current">ひとこと</Label>
				<Textarea id="quote" name="quote" />
			</div>
			<div className="space-y-1">
				<Label htmlFor="url">URL</Label>
				<Input id="url" name="url" /*type="url"*/ required />
			</div>
		</div>
	);
}
