export class PushSubscriptionError extends Error {
	public readonly code:
		| "UNAVAILABLE"
		| "FORBIDDEN"
		| "NOT_FOUND"
		| "REQUIRES_RESUBSCRIBE"
		| "INVALID_KEY";

	constructor(
		code:
			| "UNAVAILABLE"
			| "FORBIDDEN"
			| "NOT_FOUND"
			| "REQUIRES_RESUBSCRIBE"
			| "INVALID_KEY",
		message: string,
	) {
		super(message);
		this.code = code;
		this.name = "PushSubscriptionError";
	}
}
