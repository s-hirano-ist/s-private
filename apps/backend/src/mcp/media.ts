import { ApplicationError } from "@s-hirano-ist/s-application/error";

/** Read at most one page plus a lookahead byte into memory; always release the stream. */
export async function readMediaPage(
	response: Response,
	offset: number,
	length: number,
) {
	const mimeType = response.headers.get("content-type");
	if (
		!response.ok ||
		!response.body ||
		!["image/jpeg", "image/png", "image/webp"].includes(mimeType ?? "")
	) {
		await response.body?.cancel();
		throw new ApplicationError("INTERNAL_ERROR");
	}
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let position = 0;
	let collected = 0;
	try {
		while (collected <= length) {
			const { done, value } = await reader.read();
			if (done) break;
			const start = Math.max(0, offset - position);
			position += value.byteLength;
			if (start >= value.byteLength) continue;
			const chunk = value.subarray(start, start + length + 1 - collected);
			chunks.push(chunk);
			collected += chunk.byteLength;
		}
	} finally {
		try {
			await reader.cancel();
		} finally {
			reader.releaseLock();
		}
	}
	const bytes = Buffer.concat(chunks, collected).subarray(0, length);
	return {
		data: bytes.toString("base64"),
		mimeType,
		offset,
		byteLength: bytes.byteLength,
		nextOffset: collected > length ? offset + bytes.byteLength : null,
	};
}
