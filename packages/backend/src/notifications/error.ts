export class PushSubscriptionError extends Error {
	constructor(
		public readonly code: "UNAVAILABLE" | "FORBIDDEN" | "NOT_FOUND",
		message: string,
	) {
		super(message);
		this.name = "PushSubscriptionError";
	}
}
