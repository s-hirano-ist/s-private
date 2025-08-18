import { InvalidFormatError } from "@/common/error/error-classes";

export const getFormDataString = (formData: FormData, key: string): string => {
	const value = formData.get(key);

	if (typeof value !== "string") {
		throw new InvalidFormatError();
	}

	return value;
};

export const getFormDataFile = (formData: FormData, key: string): File => {
	const value = formData.get(key);

	if (!(value instanceof File)) {
		throw new InvalidFormatError();
	}

	return value;
};
