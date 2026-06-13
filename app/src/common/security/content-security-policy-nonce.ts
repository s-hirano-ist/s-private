export function resolveContentSecurityPolicyNonce(
	nonce: string | null,
	isProduction: boolean,
): string | undefined {
	if (isProduction && !nonce) {
		throw new Error("CSP nonce is missing from the request headers");
	}

	return nonce ?? undefined;
}
