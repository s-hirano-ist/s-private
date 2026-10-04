import coverage from "istanbul-lib-coverage";

const { createCoverageMap } = coverage;
import { mkdir, readFile, writeFile } from "node:fs/promises";

const outputDirectory = new URL("../.vitest-coverage/", import.meta.url);
const coverageMap = createCoverageMap({});

for (const suite of ["storybook", "node"]) {
	const coverageFile = new URL(`${suite}/coverage-final.json`, outputDirectory);
	coverageMap.merge(JSON.parse(await readFile(coverageFile, "utf8")));
}

const summary = { total: coverageMap.getCoverageSummary().toJSON() };
for (const file of coverageMap.files()) {
	summary[file] = coverageMap.fileCoverageFor(file).toSummary().toJSON();
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
	writeFile(
		new URL("coverage-final.json", outputDirectory),
		JSON.stringify(coverageMap.toJSON()),
	),
	writeFile(
		new URL("coverage-summary.json", outputDirectory),
		JSON.stringify(summary),
	),
]);
