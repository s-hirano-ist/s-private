import { z } from "zod";

export type Result<T, E = Error> = Success<T> | Failure<E>;

export type Success<T> = {
	readonly isSuccess: true;
	readonly isFailure: false;
	readonly value: T;
};

export type Failure<E> = {
	readonly isSuccess: false;
	readonly isFailure: true;
	readonly error: E;
};

export const Result = {
	success: <T>(value: T): Success<T> => ({
		isSuccess: true,
		isFailure: false,
		value,
	}),

	failure: <E>(error: E): Failure<E> => ({
		isSuccess: false,
		isFailure: true,
		error,
	}),

	fromThrowable: <T, E = Error>(
		fn: () => T,
		errorMapper?: (error: unknown) => E,
	): Result<T, E> => {
		try {
			return Result.success(fn());
		} catch (error) {
			const mappedError = errorMapper ? errorMapper(error) : (error as E);
			return Result.failure(mappedError);
		}
	},

	fromPromise: async <T, E = Error>(
		promise: Promise<T>,
		errorMapper?: (error: unknown) => E,
	): Promise<Result<T, E>> => {
		try {
			const value = await promise;
			return Result.success(value);
		} catch (error) {
			const mappedError = errorMapper ? errorMapper(error) : (error as E);
			return Result.failure(mappedError);
		}
	},

	fromZodParse: <T, E = z.ZodError>(
		schema: z.ZodSchema<T>,
		data: unknown,
		errorMapper?: (error: z.ZodError) => E,
	): Result<T, E> => {
		const parseResult = schema.safeParse(data);
		if (parseResult.success) {
			return Result.success(parseResult.data);
		}
		const mappedError = errorMapper
			? errorMapper(parseResult.error)
			: (parseResult.error as E);
		return Result.failure(mappedError);
	},

	map: <T, U, E>(
		result: Result<T, E>,
		mapper: (value: T) => U,
	): Result<U, E> => {
		if (result.isSuccess) {
			return Result.success(mapper(result.value));
		}
		return result;
	},

	flatMap: <T, U, E>(
		result: Result<T, E>,
		mapper: (value: T) => Result<U, E>,
	): Result<U, E> => {
		if (result.isSuccess) {
			return mapper(result.value);
		}
		return result;
	},

	match: <T, E, R>(
		result: Result<T, E>,
		handlers: {
			success: (value: T) => R;
			failure: (error: E) => R;
		},
	): R => {
		if (result.isSuccess) {
			return handlers.success(result.value);
		}
		return handlers.failure(result.error);
	},

	unwrap: <T, E>(result: Result<T, E>): T => {
		if (result.isSuccess) {
			return result.value;
		}
		throw new Error(
			`Attempted to unwrap a failure: ${JSON.stringify(result.error)}`,
		);
	},

	unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T => {
		if (result.isSuccess) {
			return result.value;
		}
		return defaultValue;
	},

	isSuccess: <T, E>(result: Result<T, E>): result is Success<T> => {
		return result.isSuccess;
	},

	isFailure: <T, E>(result: Result<T, E>): result is Failure<E> => {
		return result.isFailure;
	},
};
