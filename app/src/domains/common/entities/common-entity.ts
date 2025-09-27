import { z } from "zod";
import { idGenerator } from "../services/id-generator";

// common value objects

export const Id = z
	.uuid({ version: "v7" })
	.default(() => idGenerator.uuidv7())
	.brand<"Id">();
export type Id = z.infer<typeof Id>;
export const makeId = (id?: string): Id => {
	if (!id) return Id.parse(idGenerator.uuidv7());
	return Id.parse(id);
};

export const UserId = z.string().min(1, "required").brand<"UserId">();
export type UserId = z.infer<typeof UserId>;
export const makeUserId = (v: string): UserId => UserId.parse(v);

export const CreatedAt = z.date().brand<"CreatedAt">();
export type CreatedAt = z.infer<typeof CreatedAt>;
export const makeCreatedAt = (createdAt?: Date): CreatedAt => {
	if (!createdAt) return CreatedAt.parse(new Date());
	return CreatedAt.parse(createdAt);
};

export const UnexportedStatus = z.literal("UNEXPORTED");
export type UnexportedStatus = z.infer<typeof UnexportedStatus>;
export const makeUnexportedStatus = (): UnexportedStatus =>
	UnexportedStatus.parse("UNEXPORTED");

export const ExportedAt = z.date().brand<"ExportedAt">();
export type ExportedAt = z.infer<typeof ExportedAt>;
export const makeExportedAt = (exportedAt?: Date): ExportedAt => {
	if (!exportedAt) return ExportedAt.parse(new Date());
	return ExportedAt.parse(exportedAt);
};

export const ExportedStatus = z.object({
	status: z.literal("EXPORTED"),
	exportedAt: ExportedAt,
});
export type ExportedStatus = z.infer<typeof ExportedStatus>;
export const makeExportedStatus = (): ExportedStatus =>
	ExportedStatus.parse({ status: "EXPORTED", exportedAt: new Date() });

export type Status = UnexportedStatus | ExportedStatus["status"];

// Legacy compatibility - will be removed in future
export const makeStatus = (status: "UNEXPORTED" | "EXPORTED"): Status => {
	return status as Status;
};
