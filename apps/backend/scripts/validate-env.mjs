import { loadBackendEnv } from "s-private-backend/env";
import { ZodError } from "zod";

try {
	loadBackendEnv();
	console.log("Backend deployment environment is valid.");
} catch (error) {
	// Build logs are shared: report invalid keys, never values or raw exceptions.
	const fields =
		error instanceof ZodError
			? [...new Set(error.issues.map((issue) => issue.path.join(".")))].join(
					", ",
				)
			: "deployment policy";
	console.error(`Invalid backend deployment environment: ${fields}`);
	process.exitCode = 1;
}
