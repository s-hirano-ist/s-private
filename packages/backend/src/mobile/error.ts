export class MobileApiError extends Error {
	public readonly code: string;
	public readonly status: number;

	constructor(code: string, status: number) {
		super(code);
		this.code = code;
		this.status = status;
	}
}
