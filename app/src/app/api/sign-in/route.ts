import { signIn } from "@/infrastructures/auth/auth-provider";

export async function GET() {
	await signIn("auth0", { redirectTo: "/" }, { prompt: "login" });
}
