import { ZodError } from "zod";
import {
	InvalidFormatError,
	UnexpectedError,
} from "../../errors/error-classes";

export const createEntityWithErrorHandling = <T>(factory: () => T): T => {
	try {
		return factory();
	} catch (error) {
		if (error instanceof ZodError) throw new InvalidFormatError();
		throw new UnexpectedError();
	}
};
