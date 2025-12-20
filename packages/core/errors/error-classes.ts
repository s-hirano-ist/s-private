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

export class DuplicateError extends Error {
	constructor() {
		super("duplicate");
		this.name = "DuplicateError";
	}
}

export class FileNotAllowedError extends Error {
	constructor() {
		super("invalidFileFormat");
		this.name = "FileNotAllowedError";
	}
}
