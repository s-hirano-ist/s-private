import { describe, expect, test } from "vitest";
import { resolveContentSecurityPolicyNonce } from "./content-security-policy-nonce";

describe("resolveContentSecurityPolicyNonce", () => {
	test("returns the request nonce", () => {
		expect(resolveContentSecurityPolicyNonce("request-nonce", true)).toBe(
			"request-nonce",
		);
	});

	test("throws when a production request has no nonce", () => {
		expect(() => resolveContentSecurityPolicyNonce(null, true)).toThrow(
			"CSP nonce is missing from the request headers",
		);
	});

	test("allows missing nonces outside production", () => {
		expect(resolveContentSecurityPolicyNonce(null, false)).toBeUndefined();
	});
});
