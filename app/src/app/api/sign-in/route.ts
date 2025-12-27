import { redirect } from "next/navigation";

export async function GET() {
	// Better AuthのGeneric OAuth経由でAuth0にリダイレクト
	redirect("/api/auth/sign-in/social?provider=auth0&callbackURL=/");
}
