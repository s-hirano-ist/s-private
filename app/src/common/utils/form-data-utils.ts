/**
 * FormData extraction utilities with type validation.
 *
 * @module
 */

import { InvalidFormatError } from "@/common/error/error-classes";

/**
 * Extracts a string value from FormData.
 *
 * @param formData - Source FormData object
 * @param key - Field key to extract
 * @returns String value from the form field
 * @throws InvalidFormatError if value is not a string
 */
export const getFormDataString = (formData: FormData, key: string): string => {
	const value = formData.get(key);

	if (typeof value !== "string") {
		throw new InvalidFormatError();
	}

	return value;
};

/**
 * Extracts a File from FormData.
 *
 * @param formData - Source FormData object
 * @param key - Field key to extract
 * @returns File object from the form field
 * @throws InvalidFormatError if value is not a File
 */
export const getFormDataFile = (formData: FormData, key: string): File => {
	const value = formData.get(key);

	if (!(value instanceof File)) {
		throw new InvalidFormatError();
	}

	return value;
};
