import type { Transaction } from "@s-hirano-ist/s-application/transaction";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import { withTransactionRetry } from "@s-hirano-ist/s-database";
import { AsyncLocalStorage } from "node:async_hooks";

/** A composition-local client routes repository calls to the current transaction.
 * AsyncLocalStorage keeps concurrent requests and retry attempts isolated.
 * The callback must contain database work only.
 */
export function createTransactionalDatabase(client: DatabaseClient) {
	const scope = new AsyncLocalStorage<
		Omit<
			DatabaseClient,
			"$transaction" | "$connect" | "$disconnect" | "$extends" | "$on" | "$use"
		>
	>();
	const database = new Proxy(client, {
		get(target, key): unknown {
			const current = scope.getStore() ?? target;
			const value: unknown = Reflect.get(current, key);
			return typeof value === "function" ? value.bind(current) : value;
		},
	});
	const transactions: Transaction = {
		run: (work) =>
			withTransactionRetry(() =>
				client.$transaction((tx) => scope.run(tx, work)),
			),
	};
	return { database, transactions };
}
