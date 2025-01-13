import { signIn } from "@/features/auth/utils/auth";

export async function GET() {
	await signIn("auth0", { redirectTo: "/" }, { prompt: "login" });
}
