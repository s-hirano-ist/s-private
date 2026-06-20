import { FileNotAllowedError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";

export type UploadFileNotAllowedReason =
	| "empty-buffer"
	| "unsupported-signature"
	| "metadata-read-failed"
	| "metadata-format-missing"
	| "metadata-format-unsupported"
	| "detected-format-mismatch"
	| "thumbnail-creation-failed";

export type UploadFileNotAllowedDiagnostics = Readonly<{
	reason: UploadFileNotAllowedReason;
	fileName: string;
	fileSize: number;
	declaredContentType: string;
	detectedContentType?: string;
	decodedFormat?: string;
	causeMessage?: string;
}>;

export class UploadFileNotAllowedError extends FileNotAllowedError {
	readonly diagnostics: UploadFileNotAllowedDiagnostics;

	constructor(diagnostics: UploadFileNotAllowedDiagnostics) {
		super();
		this.name = "UploadFileNotAllowedError";
		this.diagnostics = diagnostics;
	}
}

export function getUploadFileNotAllowedDiagnostics(
	error: unknown,
): UploadFileNotAllowedDiagnostics | undefined {
	if (error instanceof UploadFileNotAllowedError) {
		return error.diagnostics;
	}

	return undefined;
}
