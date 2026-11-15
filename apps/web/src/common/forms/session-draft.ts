/** Explicit policies only: never serialize an entire form to Storage. */
export const noteDraftFields = ["title", "markdown"] as const;
const prefix = "s-private:form-draft:v1:";
const controllers = new Set<{ owner: string; revoke: () => void }>();

function storage() {
	return window.sessionStorage;
}

function removeOtherDrafts(owner?: string) {
	try {
		const keep =
			owner === undefined
				? undefined
				: `${prefix}${encodeURIComponent(owner)}:`;
		for (const key of Object.keys(storage())) {
			if (key.startsWith(prefix) && !key.startsWith(keep ?? "\0"))
				storage().removeItem(key);
		}
	} catch {
		/* Storage is optional. */
	}
}

/** Revoke writers as well as deleting data so pending timers cannot resurrect it. */
export function clearSessionDrafts() {
	for (const controller of controllers) controller.revoke();
	removeOtherDrafts();
}

export function createSessionDraft(
	owner: string,
	domain: string,
	purpose: string,
	fields: readonly string[],
) {
	for (const controller of controllers) {
		if (controller.owner !== owner) controller.revoke();
	}
	removeOtherDrafts(owner);
	const key = `${prefix}${encodeURIComponent(owner)}:${encodeURIComponent(domain)}:${encodeURIComponent(purpose)}`;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let latest: Record<string, string> | undefined;
	let revoked = false;
	function cancel() {
		clearTimeout(timer);
		timer = undefined;
		latest = undefined;
	}
	const controller = {
		owner,
		revoke: () => {
			revoked = true;
			cancel();
		},
	};
	controllers.add(controller);
	function clear() {
		cancel();
		try {
			storage().removeItem(key);
		} catch {
			/* Storage is optional. */
		}
	}
	function flush() {
		clearTimeout(timer);
		timer = undefined;
		if (revoked || !latest) return;
		const values = latest;
		latest = undefined;
		try {
			storage().setItem(
				key,
				JSON.stringify({ version: 1, updatedAt: Date.now(), values }),
			);
		} catch {
			/* Quota/security errors must not interrupt editing. */
		}
	}
	return {
		key,
		read(): FormData | undefined {
			if (revoked) return undefined;
			try {
				const raw = storage().getItem(key);
				if (!raw) return undefined;
				const data: unknown = JSON.parse(raw);
				if (
					!data ||
					typeof data !== "object" ||
					!("version" in data) ||
					data.version !== 1 ||
					!("updatedAt" in data) ||
					typeof data.updatedAt !== "number" ||
					!Number.isFinite(data.updatedAt) ||
					!("values" in data) ||
					!data.values ||
					typeof data.values !== "object" ||
					Array.isArray(data.values)
				) {
					clear();
					return undefined;
				}
				const values = data.values as Record<string, unknown>;
				if (
					Object.keys(values).length !== fields.length ||
					fields.some((field) => typeof values[field] !== "string")
				) {
					clear();
					return undefined;
				}
				const result = new FormData();
				for (const field of fields) result.set(field, values[field] as string);
				return result;
			} catch {
				clear();
				return undefined;
			}
		},
		schedule(data: FormData) {
			if (revoked) return;
			latest = Object.fromEntries(
				fields.map((field) => [
					field,
					typeof data.get(field) === "string" ? data.get(field) : "",
				]),
			) as Record<string, string>;
			clearTimeout(timer);
			timer = setTimeout(flush, 250);
		},
		flush,
		clear,
		dispose() {
			flush();
			controller.revoke();
			controllers.delete(controller);
		},
	};
}
