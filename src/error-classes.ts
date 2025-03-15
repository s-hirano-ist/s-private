export class PushoverError extends Error {
	constructor() {
		super("pushoverSend");
		this.name = "PushoverError";
	}
}

export class NotAllowedError extends Error {
	constructor() {
		super("notAllowed");
		this.name = "NotAllowedError";
	}
}

export class UnauthorizedError extends Error {
	constructor() {
		super("unauthorized");
		this.name = "UnauthorizedError";
	}
}

export class UnexpectedError extends Error {
	constructor() {
		super("unexpected");
		this.name = "UnexpectedError";
	}
}

export class InvalidFormatError extends Error {
	constructor() {
		super("invalidFormat");
		this.name = "InvalidFormatError";
	}
}

export class FileNotAllowedError extends Error {
	constructor() {
		super("invalidFileFormat");
		this.name = "FileNotAllowedError";
	}
}
