import { runMobileOperation } from "@s-hirano-ist/s-application/mobile/operations";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { extendDatabase } from "@s-hirano-ist/s-infrastructure/database";
import { createMobilePersistence } from "@s-hirano-ist/s-infrastructure/mobile/prisma-persistence";
import { createTransactionalDatabase } from "@s-hirano-ist/s-infrastructure/transaction";
import { randomUUID } from "node:crypto";
import { afterAll, expect, test, vi } from "vitest";
import { z } from "zod";

const url = process.env.TEST_DATABASE_URL;
if (url && !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
	throw new Error("Integration tests require a local database");
const client = createPrismaClient(
	url ?? "postgresql://root@127.0.0.1:26257/issue2951?sslmode=disable",
);
const { database, transactions } = createTransactionalDatabase(
	extendDatabase(
		client,
		(_model, _operation, args) => args,
		() => {},
	),
);
const operations = createMobilePersistence(database);
const owner = `integration-${randomUUID()}`;
afterAll(async () => {
	if (url) {
		await database.note.deleteMany({ where: { userId: owner } });
		await database.mobileOperation.deleteMany({ where: { userId: owner } });
		await database.mobileSyncChange.deleteMany({ where: { userId: owner } });
		await database.mobileSyncVersion.deleteMany({ where: { userId: owner } });
	}
	await client.$disconnect();
});

test.skipIf(!url)(
	"content, operation result and sync trigger commit or roll back together",
	async () => {
		const id = randomUUID();
		const operationId = randomUUID();
		const work = () =>
			runMobileOperation(
				owner,
				"notes",
				operationId,
				{},
				(commit) =>
					commit(async () => {
						await database.note.create({
							data: {
								id,
								userId: owner,
								title: id,
								markdown: "Body",
								status: "UNEXPORTED",
								createdAt: new Date(),
								updatedAt: new Date(),
							},
						});
						return id;
					}),
				{ operations, transactions },
			);
		expect((await work()).resource.id).toBe(id);
		expect((await work()).resource.id).toBe(id);
		expect(await database.note.count({ where: { id } })).toBe(1);
		expect((await operations.findOperation(operationId))?.status).toBe(
			"SUCCEEDED",
		);
		const before = await operations.getSyncVersion(owner);
		await expect(
			transactions.run(async () => {
				await database.note.create({
					data: {
						id: randomUUID(),
						userId: owner,
						title: "rollback",
						markdown: "Body",
						status: "UNEXPORTED",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});
				await database.mobileOperation.update({
					where: { id: operationId },
					data: { resourceId: "rollback" },
				});
				throw new Error("rollback");
			}),
		).rejects.toThrow("rollback");
		expect(await database.note.count({ where: { userId: owner } })).toBe(1);
		expect((await operations.findOperation(operationId))?.resourceId).toBe(id);
		expect(await operations.getSyncVersion(owner)).toBe(before);
		expect(before).toBeGreaterThan(0n);
	},
);

test.skipIf(!url)(
	"only one concurrent claim wins; expired tokens cannot commit or fail a newer attempt",
	async () => {
		const operationId = randomUUID();
		const results = await Promise.allSettled(
			Array.from({ length: 8 }, () =>
				operations.claimOperation(operationId, owner, "notes", "a".repeat(64)),
			),
		);
		const winners = results.filter((result) => result.status === "fulfilled");
		expect(winners).toHaveLength(1);
		expect(
			results
				.filter((result) => result.status === "rejected")
				.map((result) => result.reason),
		).toEqual(
			Array.from({ length: 7 }, () =>
				expect.objectContaining({ code: "OPERATION_IN_PROGRESS" }),
			),
		);
		const first = z.object({ token: z.string() }).parse(winners[0].value);
		await expect(
			operations.claimOperation(
				operationId,
				"foreign",
				"notes",
				"a".repeat(64),
			),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
		await expect(
			operations.claimOperation(operationId, owner, "books", "a".repeat(64)),
		).rejects.toMatchObject({ code: "OPERATION_CONFLICT" });
		await expect(
			operations.claimOperation(operationId, owner, "notes", "b".repeat(64)),
		).rejects.toMatchObject({ code: "OPERATION_CONFLICT" });
		expect(await operations.renewOperation(operationId, first.token)).toBe(
			true,
		);
		await database.mobileOperation.update({
			where: { id: operationId },
			data: { leaseExpiresAt: new Date(0) },
		});
		const second = z
			.object({ token: z.string() })
			.parse(
				await operations.claimOperation(
					operationId,
					owner,
					"notes",
					"a".repeat(64),
				),
			);
		expect(second.token).not.toBe(first.token);
		expect(await operations.renewOperation(operationId, first.token)).toBe(
			false,
		);
		await expect(
			transactions.run(async () => {
				await database.note.create({
					data: {
						id: randomUUID(),
						userId: owner,
						title: "stale worker",
						markdown: "Body",
						status: "UNEXPORTED",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});
				await operations.markOperationSucceeded(
					operationId,
					"stale",
					first.token,
				);
			}),
		).rejects.toMatchObject({ code: "OPERATION_IN_PROGRESS" });
		expect(
			await database.note.count({
				where: { userId: owner, title: "stale worker" },
			}),
		).toBe(0);
		await operations.markOperationFailed(operationId, "OLD", first.token);
		expect((await operations.findOperation(operationId))?.status).toBe(
			"PENDING",
		);
		await operations.markOperationSucceeded(
			operationId,
			"current",
			second.token,
		);
		await operations.markOperationFailed(operationId, "OLD", first.token);
		expect(
			await operations.claimOperation(
				operationId,
				owner,
				"notes",
				"a".repeat(64),
			),
		).toEqual({ resourceId: "current" });
	},
);

test.skipIf(!url)(
	"wrapped serialization failures roll back and retry only the database work",
	async () => {
		const maybeConflict = vi
			.fn()
			.mockRejectedValueOnce(
				new Error("create-record", {
					cause: Object.assign(new Error("serialization conflict"), {
						code: "P2034",
					}),
				}),
			)
			.mockResolvedValue(undefined);
		const id = randomUUID();
		const prepareStorage = vi.fn(async () => {});
		const dispatch = vi.fn(async () => {});
		await prepareStorage();
		await transactions.run(async () => {
			await database.note.create({
				data: {
					id,
					userId: owner,
					title: "serialization retry",
					markdown: "Body",
					status: "UNEXPORTED",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});
			await maybeConflict();
		});
		await dispatch();
		expect(maybeConflict).toHaveBeenCalledTimes(2);
		expect(await database.note.count({ where: { id } })).toBe(1);
		expect(prepareStorage).toHaveBeenCalledOnce();
		expect(dispatch).toHaveBeenCalledOnce();
	},
);
