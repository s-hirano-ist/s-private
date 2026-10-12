import { minioStorageService } from "@/infrastructures/shared/storage/minio-storage-service";
import prisma from "@/prisma";
import { createLocalSampleSeeder } from "@s-hirano-ist/s-backend/shared/local-fixtures";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const fixturePath = "packages/backend/fixtures/local-sample-landscape.png";
export const seedLocalDevelopmentSampleData = createLocalSampleSeeder({
	database: prisma,
	storage: minioStorageService,
	loadImage: () =>
		readFile(
			existsSync(resolve(fixturePath))
				? resolve(fixturePath)
				: resolve("..", fixturePath),
		),
});
