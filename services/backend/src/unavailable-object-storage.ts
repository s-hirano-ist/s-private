import type { ApiServicesConfig } from "s-private-backend/api/composition";
import { MobileApiError } from "s-private-backend/mobile/error";

async function unavailable(): Promise<never> {
	throw new MobileApiError("NOT_FOUND", 404);
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
