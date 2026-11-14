type Attributes = Record<string, string | number>;
type Level = "info" | "warn" | "error";
export type TelemetrySdk = {
	logger: Record<Level, (message: string, attributes?: Attributes) => void>;
	metrics: {
		count(
			name: string,
			value: number,
			options: { attributes: Attributes },
		): void;
		distribution(
			name: string,
			value: number,
			options: { attributes: Attributes; unit: "millisecond" },
		): void;
	};
};

/** Operational diagnostics must never change the outcome of business work. */
export function observe(action: () => unknown): void {
	try {
		action();
	} catch {
		/* The existing local/error sinks remain available. */
	}
}

const jobs = new Set([
	"cleanup-minio-images",
	"enrich-books",
	"find-duplicate-json-articles",
	"fix-book-frontmatter",
	"fix-image-formats",
	"validate-json-articles",
	"update-json-articles",
	"update-raw-articles",
	"s-content-format",
	"rag-delete-collection",
	"rag-search",
	"rag-ingest",
	...["fetch", "ingest", "reset", "revert"].flatMap((operation) =>
		["articles", "books", "images", "notes"].map(
			(domain) => `${operation}-${domain}`,
		),
	),
]);
export function telemetryJob(value: string): string {
	return jobs.has(value) ? value : "other";
}

export function operationalAttributes(
	attributes: Record<string, unknown> = {},
): Attributes {
	return Object.fromEntries(
		Object.entries(attributes).filter(
			(entry): entry is [string, string | number] => {
				const [key, value] = entry;
				return (
					[
						"tool",
						"client",
						"method",
						"route",
						"domain",
						"status",
						"job",
						"sentry.environment",
						"sentry.release",
						"sentry.sdk.name",
						"sentry.sdk.version",
						"sentry.trace.parent_span_id",
						"sentry.replay_id",
					].includes(key) &&
					(typeof value === "string" || typeof value === "number")
				);
			},
		),
	);
}

export function createOperationalTelemetry(
	sdk: TelemetrySdk,
	enabled: () => boolean,
) {
	return {
		log(level: Level, message: string, attributes: Attributes = {}) {
			if (enabled())
				observe(() =>
					sdk.logger[level](message, operationalAttributes(attributes)),
				);
		},
		count(name: string, value: number, attributes: Attributes = {}) {
			if (enabled())
				observe(() =>
					sdk.metrics.count(name, value, {
						attributes: operationalAttributes(attributes),
					}),
				);
		},
		duration(name: string, milliseconds: number, attributes: Attributes = {}) {
			if (enabled())
				observe(() =>
					sdk.metrics.distribution(name, milliseconds, {
						attributes: operationalAttributes(attributes),
						unit: "millisecond",
					}),
				);
		},
	};
}
export type OperationalTelemetry = ReturnType<
	typeof createOperationalTelemetry
>;
