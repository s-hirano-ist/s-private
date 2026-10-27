import { setTimeout as delay } from "node:timers/promises";
import { ApiError } from "s-private-backend/api/error";

export const AUTH_RETRY_AFTER_SECONDS = 30;

/** Already reported by the initializer; request handlers must not report it again. */
export class AuthInitializationError extends ApiError {
	constructor(codes: readonly string[] = []) {
		super("API_UNAVAILABLE");
		this.name = "AuthInitializationError";
		this.message = `Auth initialization failed (discovery/validation): ${codes.join(",") || "UNKNOWN"}`;
	}
}

export function createRecoverableAuth<T>(
	initialize: () => Promise<T>,
	report: {
		failure(error: AuthInitializationError): unknown;
		recovery(): unknown;
	},
) {
	let ready: T | undefined;
	let pending: Promise<T> | undefined;
	let failed: AuthInitializationError | undefined;
	let retryAt = 0;

	async function initializeWithRetry(): Promise<T> {
		for (let attempt = 0; attempt < 2; attempt += 1) {
			try {
				const auth = await initialize();
				ready = auth;
				if (failed) {
					failed = undefined;
					await report.recovery();
				}
				return auth;
			} catch (error) {
				if (attempt === 0) {
					await delay(250);
					continue;
				}
				failed =
					error instanceof AuthInitializationError
						? error
						: new AuthInitializationError();
				retryAt = Date.now() + AUTH_RETRY_AFTER_SECONDS * 1000;
				await report.failure(failed);
				throw failed;
			}
		}
		throw new AuthInitializationError();
	}

	return function getAuth(): Promise<T> {
		if (ready !== undefined) return Promise.resolve(ready);
		if (pending) return pending;
		if (failed && Date.now() < retryAt) return Promise.reject(failed);
		pending = initializeWithRetry().finally(() => {
			pending = undefined;
		});
		return pending;
	};
}
