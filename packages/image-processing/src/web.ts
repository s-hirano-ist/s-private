import type {
	ConvertToWebpOptions,
	ImageMetadata,
	PhotonModule,
	ThumbnailOptions,
} from "./shared.ts";
import initPhoton, {
	PhotonImage,
	SamplingFilter,
	crop,
	resize,
} from "@silvia-odwyer/photon/photon_rs.js";
import {
	convertToWebpWithPhoton,
	createWebpThumbnailWithPhoton,
	readImageMetadataWithPhoton,
} from "./shared.ts";

export { detectSupportedImageFormat, fileToBytes } from "./shared.ts";
export type {
	ConvertToWebpOptions,
	ImageMetadata,
	SupportedImageFormat,
	ThumbnailOptions,
} from "./shared.ts";

let photonPromise: Promise<PhotonModule> | undefined;

function isNodeRuntime(): boolean {
	const maybeProcess = (
		globalThis as {
			process?: { versions?: { node?: string } };
		}
	).process;

	return (
		maybeProcess?.versions?.node !== undefined && !("EdgeRuntime" in globalThis)
	);
}

async function loadWasmForNode(): Promise<Uint8Array> {
	const [{ readFile }, { createRequire }] = await Promise.all([
		import("node:fs/promises"),
		import("node:module"),
	]);
	const require = createRequire(import.meta.url);
	const wasmPath = require.resolve("@silvia-odwyer/photon/photon_rs_bg.wasm");
	return await readFile(wasmPath);
}

async function loadPhoton(): Promise<PhotonModule> {
	if (photonPromise !== undefined) {
		return photonPromise;
	}

	photonPromise = (async () => {
		if (isNodeRuntime()) {
			await initPhoton({ module_or_path: await loadWasmForNode() });
		} else {
			await initPhoton();
		}

		return { PhotonImage, SamplingFilter, crop, resize };
	})();

	return photonPromise;
}

export async function readImageMetadata(
	bytes: Uint8Array,
): Promise<ImageMetadata> {
	return readImageMetadataWithPhoton(bytes, await loadPhoton());
}

export async function createWebpThumbnail(
	bytes: Uint8Array,
	options: ThumbnailOptions,
): Promise<Uint8Array> {
	return createWebpThumbnailWithPhoton(bytes, options, await loadPhoton());
}

export async function convertToWebp(
	bytes: Uint8Array,
	options?: ConvertToWebpOptions,
): Promise<Uint8Array> {
	return convertToWebpWithPhoton(bytes, await loadPhoton(), options);
}
