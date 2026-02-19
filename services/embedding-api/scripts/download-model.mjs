/**
 * Pre-download model files from HuggingFace Hub.
 *
 * Bypasses @huggingface/transformers library entirely, using only
 * Node.js built-in fetch() + fs to avoid the getModelFile() bug
 * that occurs in Docker (Node 24 + webpack bundle).
 *
 * Idempotent: skips files that already exist on disk.
 */

import { createWriteStream, existsSync, mkdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const MODEL_ID = "intfloat/multilingual-e5-large";
const CACHE_DIR = join(homedir(), ".cache", "huggingface", "transformers");
const MODEL_DIR = join(CACHE_DIR, MODEL_ID);

const FILES = [
	"config.json",
	"tokenizer.json",
	"tokenizer_config.json",
	"onnx/model.onnx",
	"onnx/model.onnx_data",
];

function huggingFaceUrl(file) {
	return `https://huggingface.co/${MODEL_ID}/resolve/main/${file}`;
}

function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function downloadFile(file) {
	const dest = join(MODEL_DIR, file);

	if (existsSync(dest) && statSync(dest).size > 0) {
		console.log(`  [skip] ${file} (already exists)`);
		return;
	}

	const dir = join(dest, "..");
	mkdirSync(dir, { recursive: true });

	const url = huggingFaceUrl(file);
	console.log(`  [download] ${file} from ${url}`);

	const res = await fetch(url, { redirect: "follow" });
	if (!res.ok) {
		throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
	}

	const contentLength = res.headers.get("content-length");
	if (contentLength) {
		console.log(`  [size] ${formatBytes(Number(contentLength))}`);
	}

	const nodeStream = Readable.fromWeb(res.body);
	await pipeline(nodeStream, createWriteStream(dest));

	const finalSize = statSync(dest).size;
	console.log(`  [done] ${file} (${formatBytes(finalSize)})`);
}

async function main() {
	console.log(`Model: ${MODEL_ID}`);
	console.log(`Cache: ${CACHE_DIR}`);
	console.log(`Downloading ${FILES.length} files...\n`);

	for (const file of FILES) {
		await downloadFile(file);
	}

	console.log("\nAll model files ready.");
}

main().catch((err) => {
	console.error("Model download failed:", err);
	process.exit(1);
});
