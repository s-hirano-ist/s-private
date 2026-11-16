/** Match known decoding damage against a fresh title instead of guessing from Japanese characters. */
export function needsTitleRepair(stored: string, fresh: string): boolean {
	if (stored === fresh || fresh.includes("\uFFFD")) return false;
	if (stored.includes("\uFFFD")) return true;
	const bytes = Buffer.from(fresh, "utf8");
	if (bytes.toString("latin1").slice(0, 512) === stored) return true;
	return ["windows-1252", "shift_jis", "euc-jp"].some(
		(encoding) =>
			new TextDecoder(encoding).decode(bytes).slice(0, 512) === stored,
	);
}
