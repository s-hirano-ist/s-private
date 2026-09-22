/**
 * Application-layer entry point for local development fixtures.
 */

import { seedLocalDevelopmentSampleData as seed } from "@/infrastructures/local-development/seed-sample-data";

export async function seedLocalDevelopmentSampleData(
	userId: string,
): Promise<void> {
	await seed(userId);
}
