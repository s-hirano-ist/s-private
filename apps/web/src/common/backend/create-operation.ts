/** Persist the ID with the draft; editing any input starts a new operation. */
export async function assignCreateOperation(
	formData: FormData,
	previous?: FormData | null,
) {
	const values: [string, string][] = [];
	for (const [key, value] of formData.entries()) {
		if (["operationId", "operationFingerprint", "uploadId"].includes(key))
			continue;
		values.push([
			key,
			typeof value === "string"
				? value
				: JSON.stringify([
						value.name,
						value.type,
						await digest(await value.arrayBuffer()),
					]),
		]);
	}
	values.sort(([a], [b]) => a.localeCompare(b));
	const fingerprint = await digest(
		new TextEncoder().encode(JSON.stringify(values)).buffer,
	);
	const previousId = previous?.get("operationId");
	const operationId =
		previous?.get("operationFingerprint") === fingerprint &&
		typeof previousId === "string"
			? previousId
			: crypto.randomUUID();
	formData.set("operationId", operationId);
	formData.set("operationFingerprint", fingerprint);
}
async function digest(value: ArrayBuffer) {
	const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", value));
	return Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
}
