/** Match known decoding damage against a fresh title instead of guessing from Japanese characters. */
export function needsTitleRepair(stored: string, fresh: string): boolean {
	if (stored === fresh || fresh.includes("\uFFFD")) return false;
	if (stored.includes("\uFFFD")) return true;
	// Old parsing left numeric references unexpanded and sometimes truncated them at 512 characters.
	// Use the complete fresh title, including when the publisher has since changed its wording.
	if (hasNumericReference(stored) && !hasNumericReference(fresh)) return true;
	const bytes = Buffer.from(fresh, "utf8");
	if (bytes.toString("latin1").slice(0, 512) === stored) return true;
	return ["windows-1252", "shift_jis", "euc-jp"].some(
		(encoding) =>
			new TextDecoder(encoding).decode(bytes).slice(0, 512) === stored,
	);
}

function hasNumericReference(title: string): boolean {
	return [...title.matchAll(/&#(?:x([\da-f]{1,6})|(\d{1,7}));/giu)].some(
		([, hex, decimal]) => {
			const code = hex ? Number.parseInt(hex, 16) : Number(decimal);
			return (
				[9, 10, 13].includes(code) ||
				(code >= 0x20 && code <= 0xd7ff) ||
				(code >= 0xe000 && code <= 0xfffd) ||
				(code >= 0x10000 && code <= 0x10ffff)
			);
		},
	);
}
