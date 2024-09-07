"use client";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DEFAULT_SIGN_IN_REDIRECT } from "@/constants";
import { signIn } from "@/features/auth/actions/sign-in";
import {
	type SignInSchema,
	signInSchema,
} from "@/features/auth/schemas/sign-in-schema";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export function SignInForm() {
	const router = useRouter();
	const { toast } = useToast();

	const form = useForm<SignInSchema>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	async function onSignInSubmit(values: SignInSchema) {
		const state = await signIn(values);
		if (state.success) {
			router.push(DEFAULT_SIGN_IN_REDIRECT);
		} else {
			toast({
				variant: "destructive",
				description: state.message,
			});
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSignInSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>メールアドレス</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>パスワード</FormLabel>
							<FormControl>
								<Input {...field} type="password" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" className="w-full">
					サインイン
				</Button>
			</form>
		</Form>
	);
}