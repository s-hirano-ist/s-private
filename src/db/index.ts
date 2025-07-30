import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

const createConnection = () => {
	const client = postgres(env.DATABASE_URL, {
		max: 10,
		idle_timeout: 20,
		connect_timeout: 10,
	});

	return drizzle(client, {
		schema,
		logger: {
			logQuery(query, _params) {
				const start = Date.now();
				const duration = Date.now() - start;
				// eslint-disable-next-line
				console.log(`[${query}] took ${duration}ms`);
			},
		},
	});
};

declare const globalThis: {
	drizzleGlobal: ReturnType<typeof createConnection>;
} & typeof global;

const db = globalThis.drizzleGlobal ?? createConnection();

export default db;

if (env.NODE_ENV !== "production") globalThis.drizzleGlobal = db;