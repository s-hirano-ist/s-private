"use server";
import "server-only";
import { AuthError } from "next-auth";
import { ServerAction } from "@/common/types";
import { DomainError, Result } from "@/domains/common/value-objects";
import { Prisma } from "@/generated";
import { serverLogger } from "@/infrastructures/observability/server";

// Functional approach to form data conversion
const formDataToRecord = (
	formData?: FormData,
): Record<string, string> | undefined => {
	if (!formData) return undefined;
	return Array.from(formData.entries()).reduce(
		(acc, [key, value]) => {
			if (typeof value === "string") {
				acc[key] = value;
			}
			return acc;
		},
		{} as Record<string, string>,
	);
};

// Error mapping functions
const mapDomainErrorToServerAction = (
	error: DomainError,
	formData?: FormData,
): ServerAction => {
	const context = {
		caller: "wrapServerSideError",
		status: getStatusCodeForDomainError(error),
	};

	switch (error.type) {
		case "ValidationError":
			serverLogger.warn(error.message, context, { notify: true });
			return {
				success: false,
				message: error.message,
				formData: formDataToRecord(formData),
			};
		case "DuplicateError":
			serverLogger.warn(error.message, context, { notify: true });
			return {
				success: false,
				message: "duplicated",
				formData: formDataToRecord(formData),
			};
		case "NotFoundError":
			serverLogger.warn(error.message, context, { notify: true });
			return {
				success: false,
				message: "notFound",
				formData: formDataToRecord(formData),
			};
		case "PermissionError":
			serverLogger.warn(error.message, context, { notify: true });
			return {
				success: false,
				message: "permissionDenied",
			};
		case "BusinessRuleError":
			serverLogger.warn(error.message, context, { notify: true });
			return {
				success: false,
				message: error.message,
				formData: formDataToRecord(formData),
			};
		default:
			serverLogger.error(error.message, context, undefined, { notify: true });
			return {
				success: false,
				message: "unexpected",
			};
	}
};

const getStatusCodeForDomainError = (error: DomainError): number => {
	switch (error.type) {
		case "ValidationError":
			return 400;
		case "DuplicateError":
			return 409;
		case "NotFoundError":
			return 404;
		case "PermissionError":
			return 403;
		case "BusinessRuleError":
			return 422;
		default:
			return 500;
	}
};

const mapPrismaErrorToServerAction = (
	error: Prisma.PrismaClientError,
): ServerAction => {
	const context = {
		caller: "wrapServerSideError",
		status: 500 as const,
	};
	serverLogger.error(error.message, context, undefined, { notify: true });
	return { success: false, message: "databaseError" };
};

const mapAuthErrorToServerAction = (error: AuthError): ServerAction => {
	const context = {
		caller: "wrapServerSideError",
		status: 401 as const,
	};
	serverLogger.warn(error.message, context, { notify: true });
	return {
		success: false,
		message: "signInUnknown",
	};
};

const mapGenericErrorToServerAction = (error: unknown): ServerAction => {
	const context = {
		caller: "wrapServerSideError",
		status: 500 as const,
	};

	if (error instanceof Error) {
		serverLogger.error(error.message, context, undefined, { notify: true });
		return { success: false, message: "unexpected" };
	} else {
		serverLogger.error("unexpected", context, error, { notify: true });
		return { success: false, message: "unexpected" };
	}
};

// Main error wrapper function - functional approach
export const wrapServerSideErrorForClient = async (
	error: unknown,
	formData?: FormData,
): Promise<ServerAction> => {
	// Handle DomainError first (new functional approach)
	if (
		DomainError &&
		typeof error === "object" &&
		error !== null &&
		"type" in error
	) {
		const parseResult = Result.fromZodParse(
			require("@/domains/common/value-objects").domainErrorSchema,
			error,
		);
		if (parseResult.isSuccess) {
			return mapDomainErrorToServerAction(parseResult.value, formData);
		}
	}

	// Handle Result types
	if (error && typeof error === "object" && "isFailure" in error) {
		const result = error as { isFailure: boolean; error: DomainError };
		if (result.isFailure) {
			return mapDomainErrorToServerAction(result.error, formData);
		}
	}

	// Handle AuthError
	if (error instanceof AuthError) {
		return mapAuthErrorToServerAction(error);
	}

	// Handle Prisma errors
	if (
		error instanceof Prisma.PrismaClientValidationError ||
		error instanceof Prisma.PrismaClientUnknownRequestError ||
		error instanceof Prisma.PrismaClientRustPanicError ||
		error instanceof Prisma.PrismaClientInitializationError ||
		error instanceof Prisma.PrismaClientKnownRequestError
	) {
		return mapPrismaErrorToServerAction(error as Prisma.PrismaClientError);
	}

	// Handle legacy errors (for backward compatibility during migration)
	if (error instanceof Error) {
		const errorName = error.constructor.name;

		switch (errorName) {
			case "DuplicateError":
				return mapDomainErrorToServerAction(
					DomainError.duplicate(error.message, "unknown"),
					formData,
				);
			case "InvalidFormatError":
			case "FileNotAllowedError":
				return mapDomainErrorToServerAction(
					DomainError.validation(error.message),
					formData,
				);
			case "UnexpectedError":
			case "PushoverError":
				return mapDomainErrorToServerAction(
					DomainError.businessRule(error.message, "system_error"),
					formData,
				);
			default:
				return mapGenericErrorToServerAction(error);
		}
	}

	return mapGenericErrorToServerAction(error);
};

// Functional utility for Result-based error handling
export const handleResultForClient = <T>(
	result: Result<T, DomainError>,
	formData?: FormData,
): ServerAction | { success: true; data: T } => {
	if (result.isFailure) {
		return Result.match(result, {
			success: (data) => ({ success: true, data }),
			failure: (error) => mapDomainErrorToServerAction(error, formData),
		});
	}
	return { success: true, data: result.value };
};
