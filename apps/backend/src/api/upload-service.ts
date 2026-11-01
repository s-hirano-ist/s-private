import type { MobileDeps } from "@s-hirano-ist/s-application/mobile/deps";
import type { ErrorReporter } from "@s-hirano-ist/s-application/observability/reporter";
import type { WriteService } from "s-private-backend/api/write-service";
import * as schemas from "@s-hirano-ist/s-api-contracts/schemas";
import { createUploads } from "@s-hirano-ist/s-application/mobile/uploads";

/** HTTP contracts stay at this boundary; lifecycle and concurrency belong to Application. */
export function createUploadService(
	deps: Pick<MobileDeps, "uploads" | "chunks">,
	writes: Pick<WriteService, "media">,
	reporter: Pick<ErrorReporter, "captureException">,
) {
	const service = createUploads(
		{ ...deps, reporter },
		(owner, input, file, guard) =>
			writes.media(owner, input, file, undefined, guard),
	);
	return {
		async start(owner: string, input: Parameters<WriteService["media"]>[1]) {
			return schemas.uploadSessionSchema.parse(
				await service.start(owner, input),
			);
		},
		async get(owner: string, id: string) {
			return schemas.uploadSessionSchema.parse(await service.get(owner, id));
		},
		async put(owner: string, id: string, part: number, bytes: Uint8Array) {
			return schemas.chunkResultSchema.parse(
				await service.put(owner, id, part, bytes),
			);
		},
		async complete(owner: string, id: string) {
			return schemas.createResultSchema.parse(
				await service.complete(owner, id),
			);
		},
		cancel: (owner: string, id: string) => service.cancel(owner, id),
	};
}
export type UploadService = ReturnType<typeof createUploadService>;
