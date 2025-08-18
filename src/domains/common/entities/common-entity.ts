import { z } from "zod";
import { idGenerator } from "../services/id-generator";

// common value objects

export const Status = z.enum(["UNEXPORTED", "EXPORTED"]).brand<"Status">();
export type Status = z.infer<typeof Status>;
export const makeStatus = (v: "UNEXPORTED" | "EXPORTED"): Status =>
	Status.parse(v);

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
