import {
	isObjectNotFound,
	type ObjectStorageClient,
} from "@s-hirano-ist/s-storage";

/** Never overwrite an object when HEAD fails for authentication or transport reasons. */
export async function uploadObjectIfMissing(
	client: Pick<ObjectStorageClient, "statObject" | "putObject">,
	bucket: string,
	key: string,
	bytes: Uint8Array,
	dryRun = false,
): Promise<void> {
	if (dryRun) return;
	try {
		await client.statObject(bucket, key);
	} catch (error) {
		if (!isObjectNotFound(error)) throw error;
		await client.putObject(bucket, key, bytes);
	}
}
