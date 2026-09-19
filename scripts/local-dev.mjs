import { spawn, spawnSync } from "node:child_process";

const pnpmScript = process.env.npm_execpath;
if (!pnpmScript) throw new Error("pnpm executable path is unavailable");

function run(command, args) {
	const result = spawnSync(command, args, {
		stdio: "inherit",
		env: process.env,
	});
	if (result.error) throw result.error;
	if (result.status !== 0) process.exit(result.status ?? 1);
}

run("docker", [
	"compose",
	"--env-file",
	".env.local",
	"--profile",
	"local",
	"up",
	"-d",
	"--wait",
]);
run(pnpmScript, ["--filter", "s-database", "prisma:deploy"]);
run("node", ["scripts/init-local-search.mjs"]);

const app = spawn(pnpmScript, ["run", "dev:app"], {
	stdio: "inherit",
	env: process.env,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => app.kill(signal));
}

app.on("error", (error) => {
	throw error;
});
app.on("exit", (code, signal) => {
	if (signal) process.kill(process.pid, signal);
	else process.exit(code ?? 1);
});
