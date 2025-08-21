import { v7 } from "uuid";

export const uuidv7 = (): string => v7();

export const idGenerator = { uuidv7 };
