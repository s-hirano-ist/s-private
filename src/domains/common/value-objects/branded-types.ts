import { z } from "zod";

declare const __brand: unique symbol;

export type Brand<T, K> = T & { [__brand]: K };

export const createBrandedType = <T, K extends string>(
	name: K,
	validator: z.ZodSchema<T>,
) => {
	type BrandedType = Brand<T, K>;

	const schema = validator.brand(name);

	const create = (value: T): BrandedType => {
		const result = validator.parse(value);
		return result as BrandedType;
	};

	const safeParse = (
		value: unknown,
	): z.SafeParseReturnType<unknown, BrandedType> => {
		return schema.safeParse(value);
	};

	const parse = (value: unknown): BrandedType => {
		return schema.parse(value);
	};

	const unwrap = (branded: BrandedType): T => {
		return branded as T;
	};

	const zodSchema = schema;

	return {
		create,
		safeParse,
		parse,
		unwrap,
		schema: zodSchema,
		brandName: name,
	} as const;
};

export type BrandedTypeCreator<T, K extends string> = ReturnType<
	typeof createBrandedType<T, K>
>;

export const NonEmptyString = createBrandedType(
	"NonEmptyString",
	z.string().min(1),
);
export type NonEmptyString = Brand<string, "NonEmptyString">;

export const PositiveNumber = createBrandedType(
	"PositiveNumber",
	z.number().positive(),
);
export type PositiveNumber = Brand<number, "PositiveNumber">;

export const UUID = createBrandedType("UUID", z.string().uuid());
export type UUID = Brand<string, "UUID">;

export const EmailAddress = createBrandedType(
	"EmailAddress",
	z.string().email(),
);
export type EmailAddress = Brand<string, "EmailAddress">;

export const Url = createBrandedType("Url", z.string().url());
export type Url = Brand<string, "Url">;
