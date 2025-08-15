import { v7 } from "uuid";

export class IdGenerator {
	uuidv7(): string {
		return v7();
	}
}

export const idGenerator = new IdGenerator();
