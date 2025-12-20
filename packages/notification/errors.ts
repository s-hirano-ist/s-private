export class NotificationError extends Error {
	constructor(message = "notificationSend") {
		super(message);
		this.name = "NotificationError";
	}
}
