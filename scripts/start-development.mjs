import { spawn } from "node:child_process";

const pnpmScript = process.env.npm_execpath;
if (!pnpmScript) throw new Error("pnpm executable path is unavailable");

const services = spawn(
	pnpmScript,
	[
		"--parallel",
		"--filter",
		"s-private-app",
		"--filter",
		"s-private-backend",
		"--filter",
		"@s-hirano-ist/s-ui",
		"run",
		"dev",
	],
	{
		stdio: "inherit",
		env: {
			...process.env,
			BACKEND_URL:
				process.env.BACKEND_URL ||
				`http://127.0.0.1:${process.env.BACKEND_PORT || "3002"}`,
		},
	},
);

for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => services.kill(signal));
}
services.on("error", (error) => {
	throw error;
});
services.on("exit", (code, signal) => {
	if (signal) process.kill(process.pid, signal);
	else process.exit(code ?? 1);
});
