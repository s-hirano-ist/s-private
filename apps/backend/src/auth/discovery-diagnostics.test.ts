import { channel } from "node:diagnostics_channel";
import { withDiscoveryDiagnostics } from "s-private-backend/auth/discovery-diagnostics";
import { expect, test } from "vite-plus/test";

test("collects only allowlisted codes for the discovery request and releases its subscriber", async () => {
	const errors = channel("undici:request:error");
	const codes = new Set<string>();
	const url = new URL("https://auth.example/.well-known/openid-configuration");
	const error = Object.assign(new Error("Bearer secret-token"), {
		code: "ENOTFOUND",
		cookie: "secret-cookie",
	});
	const publish = (path: string, code: string) =>
		errors.publish({ request: { origin: url.origin, path }, error: { code } });
	await withDiscoveryDiagnostics(
		url,
		async () => {
			publish("/callback?code=secret", "ECONNRESET");
			publish(url.pathname, "SECRET_VALUE");
			errors.publish({
				request: { origin: url.origin, path: url.pathname },
				error: new AggregateError([error]),
			});
		},
		codes,
	);
	publish(url.pathname, "ETIMEDOUT");
	expect([...codes]).toEqual(["ENOTFOUND"]);
});
