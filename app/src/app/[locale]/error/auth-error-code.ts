const AUTH_ERROR_CODE_PATTERN = /^[\w-]{1,64}$/u;

export function normalizeAuthErrorCode(
	value: string | string[] | undefined,
): string {
	const candidate = Array.isArray(value) ? value[0] : value;
	return candidate && AUTH_ERROR_CODE_PATTERN.test(candidate)
		? candidate
		: "unknown";
}
