import type { ApiServicesConfig } from "s-private-backend/api/composition";
import { ApiError } from "s-private-backend/api/error";

async function unavailable(): Promise<never> {
	throw new ApiError("NOT_FOUND");
}

/** Temporary outage adapter: never connect to MinIO or pretend a write succeeded. */
export function createUnavailableObjectStorage(): {
	chunks: ApiServicesConfig["chunks"];
	storage: ApiServicesConfig["storage"]["images"];
} {
	return {
		storage: {
			getImage: unavailable,
			getImageOrThrow: unavailable,
			uploadImage: unavailable,
			deleteImage: unavailable,
		},
		chunks: { get: unavailable, put: unavailable, remove: unavailable },
	};
}
