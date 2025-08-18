import { z } from "zod";

export const domainErrorSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("ValidationError"),
		message: z.string(),
		field: z.string().optional(),
		code: z.string().optional(),
	}),
	z.object({
		type: z.literal("DuplicateError"),
		message: z.string(),
		resource: z.string(),
		identifier: z.string().optional(),
	}),
	z.object({
		type: z.literal("NotFoundError"),
		message: z.string(),
		resource: z.string(),
		identifier: z.string().optional(),
	}),
	z.object({
		type: z.literal("PermissionError"),
		message: z.string(),
		action: z.string(),
		resource: z.string().optional(),
	}),
	z.object({
		type: z.literal("BusinessRuleError"),
		message: z.string(),
		rule: z.string(),
		context: z.record(z.unknown()).optional(),
	}),
]);

export type DomainError = z.infer<typeof domainErrorSchema>;

export const DomainError = {
	validation: (
		message: string,
		field?: string,
		code?: string,
	): DomainError => ({
		type: "ValidationError",
		message,
		field,
		code,
	}),

	duplicate: (
		message: string,
		resource: string,
		identifier?: string,
	): DomainError => ({
		type: "DuplicateError",
		message,
		resource,
		identifier,
	}),

	notFound: (
		message: string,
		resource: string,
		identifier?: string,
	): DomainError => ({
		type: "NotFoundError",
		message,
		resource,
		identifier,
	}),

	permission: (
		message: string,
		action: string,
		resource?: string,
	): DomainError => ({
		type: "PermissionError",
		message,
		action,
		resource,
	}),

	businessRule: (
		message: string,
		rule: string,
		context?: Record<string, unknown>,
	): DomainError => ({
		type: "BusinessRuleError",
		message,
		rule,
		context,
	}),

	fromZodError: (error: z.ZodError, field?: string): DomainError => {
		const issues = error.issues.map((issue) => issue.message).join(", ");
		return DomainError.validation(
			`Validation failed: ${issues}`,
			field || error.issues[0]?.path.join("."),
			error.issues[0]?.code,
		);
	},
};
