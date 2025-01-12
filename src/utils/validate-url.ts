import { InvalidFormatError } from "@/error-classes";

export const validateUrl = (url: string): string => {
	const urlObj = new URL(url);
	if (urlObj.protocol === "http:" || urlObj.protocol === "https:") return url;
	throw new InvalidFormatError();
	// 下記のような対策でもOK
	// if (/^https?:\/\//.exec(url)) return url;
	// throw new InvalidFormatError();
};
