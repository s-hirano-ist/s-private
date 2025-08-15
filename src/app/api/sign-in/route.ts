import { signIn } from "@/common/auth/auth";

export async function GET() {
	await signIn("auth0", { redirectTo: "/" }, { prompt: "login" });
}
