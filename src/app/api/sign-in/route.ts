import { signIn } from "@/features/auth/utils/auth";

// middlewareから直接signInをたたけないため
export async function GET() {
	await signIn("github", { redirectTo: "/" });
}
