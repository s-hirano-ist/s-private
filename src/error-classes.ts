import { ERROR_MESSAGES, FORM_ERROR_MESSAGES } from "./constants";

export class LineNotifyError extends Error {
	constructor() {
		super(ERROR_MESSAGES.LINE_SEND);
		this.name = "LineNotifyError";
	}
}

export class NotAllowedError extends Error {
	constructor() {
		super(ERROR_MESSAGES.NOT_ALLOWED);
		this.name = "NotAllowedError";
	}
}

export class UnauthorizedError extends Error {
	constructor() {
		super(ERROR_MESSAGES.UNAUTHORIZED);
		this.name = "UnauthorizedError";
	}
}

export class UnexpectedError extends Error {
	constructor() {
		super(ERROR_MESSAGES.UNEXPECTED);
		this.name = "UnexpectedError";
	}
}

export class InvalidFormatError extends Error {
	constructor() {
		super(FORM_ERROR_MESSAGES.INVALID_FORMAT);
		this.name = "InvalidFormatError";
	}
}

export class FileNotAllowedError extends Error {
	constructor() {
		super(FORM_ERROR_MESSAGES.INVALID_FILE_FORMAT);
		this.name = "FileNotAllowedError";
	}
}
