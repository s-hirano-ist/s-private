import { glob } from "node:fs/promises";

type GlobPathsOptions = {
	cwd?: string;
};

export async function globPaths(
	pattern: string | readonly string[],
	options: GlobPathsOptions = {},
): Promise<string[]> {
	const paths: string[] = [];
	for await (const path of glob(pattern, options)) {
		paths.push(path);
	}
	return paths.toSorted((left, right) => left.localeCompare(right, "en"));
}
