/** Database work only: storage and event delivery must remain outside this boundary. */
export type MutationCommit = (work: () => Promise<string>) => Promise<string>;
export const directCommit: MutationCommit = (work) => work();
export type Transaction = { run<T>(work: () => Promise<T>): Promise<T> };
