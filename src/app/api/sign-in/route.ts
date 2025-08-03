import { signIn } from "@/utils/auth/auth";

export async function GET() {
	await signIn("auth0", { redirectTo: "/" }, { prompt: "login" });
}
