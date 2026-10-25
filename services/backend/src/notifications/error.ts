export class PushSubscriptionError extends Error {
	public readonly code: "UNAVAILABLE" | "FORBIDDEN" | "NOT_FOUND";

	constructor(
		code: "UNAVAILABLE" | "FORBIDDEN" | "NOT_FOUND",
		message: string,
	) {
		super(message);
		this.code = code;
		this.name = "PushSubscriptionError";
	}
}
