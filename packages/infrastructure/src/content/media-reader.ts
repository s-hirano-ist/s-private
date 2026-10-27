import type { MediaReader } from "@s-hirano-ist/s-application/content/queries";
import type { IStorageService } from "@s-hirano-ist/s-application/content/storage-port";
import { Readable } from "node:stream";
export function createMediaReader(
	storage: Pick<IStorageService, "getImage">,
): MediaReader {
	return {
		async getImage(path, thumbnail) {
			const stream = await storage.getImage(path, thumbnail);
			if (!(stream instanceof Readable))
				throw new Error("Unsupported storage stream");
			return {
				[Symbol.asyncIterator]() {
					const iterator = stream[Symbol.asyncIterator]();
					return {
						async next(): Promise<IteratorResult<Uint8Array>> {
							try {
								const result: IteratorResult<unknown> = await iterator.next();
								if (result.done) return { done: true, value: undefined };
								if (!(result.value instanceof Uint8Array))
									throw new Error("Invalid storage chunk");
								return { done: false, value: new Uint8Array(result.value) };
							} catch (error) {
								stream.destroy();
								throw error;
							}
						},
						async return(): Promise<IteratorResult<Uint8Array>> {
							stream.destroy();
							await iterator.return?.();
							return { done: true, value: undefined };
						},
					};
				},
			};
		},
	};
}
