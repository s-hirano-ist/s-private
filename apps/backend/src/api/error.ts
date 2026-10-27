import {
	apiErrorStatus,
	type ApiErrorCode,
} from "@s-hirano-ist/s-api-contracts/errors";
export class ApiError extends Error {
	readonly status;
	readonly code: ApiErrorCode;
	constructor(code: ApiErrorCode) {
		super(code);
		this.code = code;
		this.name = "ApiError";
		this.status = apiErrorStatus(code);
	}
}
