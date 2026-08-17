/** Trigger optional vibration feedback without assuming a browser environment. */
export function haptic(pattern: number | number[] = 50): boolean {
	try {
		if (typeof window === "undefined" || typeof navigator === "undefined") {
			return false;
		}
		if (!window.matchMedia("(pointer: coarse)").matches) return false;
		if (typeof navigator.vibrate === "function") {
			return navigator.vibrate(pattern);
		}
		return false;
	} catch {
		return false;
	}
}
