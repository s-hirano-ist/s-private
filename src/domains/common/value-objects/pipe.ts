export const pipe =
	<T>(value: T) =>
	<U>(fn: (arg: T) => U): U =>
		fn(value);

export const pipeAsync =
	<T>(value: T | Promise<T>) =>
	async <U>(fn: (arg: T) => U | Promise<U>): Promise<U> => {
		const resolvedValue = await Promise.resolve(value);
		return await Promise.resolve(fn(resolvedValue));
	};

export const compose =
	<T, U, V>(f: (x: U) => V, g: (x: T) => U) =>
	(x: T): V =>
		f(g(x));

export const identity = <T>(x: T): T => x;

export const constant =
	<T>(value: T) =>
	(): T =>
		value;

export type Predicate<T> = (value: T) => boolean;

export const and =
	<T>(...predicates: Predicate<T>[]) =>
	(value: T): boolean =>
		predicates.every((predicate) => predicate(value));

export const or =
	<T>(...predicates: Predicate<T>[]) =>
	(value: T): boolean =>
		predicates.some((predicate) => predicate(value));

export const not =
	<T>(predicate: Predicate<T>) =>
	(value: T): boolean =>
		!predicate(value);
