export class MobileApiError extends Error {
	constructor(
		public readonly code: string,
		public readonly status: number,
	) {
		super(code);
	}
}
