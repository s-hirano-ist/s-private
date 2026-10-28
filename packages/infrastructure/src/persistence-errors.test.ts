import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { Prisma } from "@s-hirano-ist/s-database";
import { withPersistenceErrors } from "@s-hirano-ist/s-infrastructure/persistence-errors";
import { expect, test } from "vitest";

test.each([
	["P2002", "DUPLICATE"],
	["P2025", "NOT_FOUND"],
] as const)(
	"%s terminates at the persistence adapter",
	async (code, expected) => {
		const error = new Prisma.PrismaClientKnownRequestError("private SQL", {
			code,
			clientVersion: "test",
		});
		await expect(
			withPersistenceErrors(() => Promise.reject(error)),
		).rejects.toEqual(new ApplicationError(expected));
	},
);
test("a conflicting push endpoint remains forbidden and unexpected failures retain their diagnostic cause", async () => {
	const conflict = new Prisma.PrismaClientKnownRequestError("private SQL", {
		code: "P2002",
		clientVersion: "test",
	});
	await expect(
		withPersistenceErrors(() => Promise.reject(conflict), "FORBIDDEN"),
	).rejects.toMatchObject({ code: "FORBIDDEN" });
	const failure = new Error("connection failure");
	await expect(
		withPersistenceErrors(() => Promise.reject(failure)),
	).rejects.toBe(failure);
});
