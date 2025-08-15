import { z } from "zod";
import { idGenerator } from "../services/id-generator";

export const statusSchema = z.enum(["UNEXPORTED", "EXPORTED"]);
export type Status = z.infer<typeof statusSchema>;

export const idSchema = z
	.string()
	.uuid()
	.default(() => idGenerator.uuidv7());

export const userIdSchema = z.string({ message: "required" });
