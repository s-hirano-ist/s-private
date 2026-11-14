import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

export function isSonarSource(path) {
	return (
		/^(?:apps\/(?:web|backend)\/src\/|packages\/)/u.test(path) &&
		/\.(?:[cm]?js|jsx|ts|tsx)$/u.test(path) &&
		!/(?:^|\/)(?:node_modules|dist|dist-package|generated|__tests__|type-tests|\.storybook)\//u.test(
			path,
		) &&
		!/\.d\.ts$|\.(?:test|spec|stories|bench)\.|(?:^|\/)(?:vitest\.config|vitest-setup)\./u.test(
			path,
		)
	);
}

export function prepareSonarScope(properties, paths) {
	const sources = paths.filter((path) => isSonarSource(path));
	const sourceDirectories = new Set(
		sources.flatMap((path) => {
			const parts = path.split("/");
			return parts
				.slice(0, -1)
				.map((_, index) => parts.slice(0, index + 1).join("/"));
		}),
	);
	const outside = paths.filter((path) => !isSonarSource(path));
	if (outside.some((path) => /[,\n\r*?\\]/u.test(path))) {
		throw new Error(
			"A file path cannot be represented as a literal Sonar exclusion.",
		);
	}
	const excluded = [
		...new Set(
			outside.map((path) => {
				const parts = path.split("/");
				for (let index = 1; index < parts.length; index += 1) {
					const directory = parts.slice(0, index).join("/");
					if (!sourceDirectories.has(directory)) return `${directory}/**`;
				}
				return path;
			}),
		),
	].toSorted();
	return properties.replace(
		/^sonar\.exclusions=(.*)$/mu,
		(_, patterns) => `sonar.exclusions=${[patterns, ...excluded].join(",")}`,
	);
}

if (import.meta.main) {
	const paths = execFileSync(
		"/usr/bin/git",
		["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
		{
			encoding: "utf8",
		},
	)
		.split("\0")
		.filter(Boolean);
	const properties = readFileSync("sonar-project.properties", "utf8");
	process.stdout.write(prepareSonarScope(properties, paths));
}
