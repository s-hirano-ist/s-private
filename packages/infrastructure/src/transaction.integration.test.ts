import { runMobileOperation } from "@s-hirano-ist/s-application/mobile/operations";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { extendDatabase } from "@s-hirano-ist/s-infrastructure/database";
import { createMobilePersistence } from "@s-hirano-ist/s-infrastructure/mobile/prisma-persistence";
import { createTransactionalDatabase } from "@s-hirano-ist/s-infrastructure/transaction";
import { randomUUID } from "node:crypto";
import { afterAll, expect, test } from "vitest";

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
