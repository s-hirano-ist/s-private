export const isValidUrl = (url: string) => {
	try {
		const urlObject = new URL(url);
		return urlObject.protocol === "http:" || urlObject.protocol === "https:";
	} catch {
		return false;
	}
};

export const isExternalUrl = (url: string): boolean => {
	if (!isValidUrl(url)) return false;

	try {
		const urlObject = new URL(url);
		return urlObject.protocol === "http:" || urlObject.protocol === "https:";
	} catch {
		return false;
	}
};

export const isInternalUrl = (url: string): boolean => {
	if (!url) return false;
	return url.startsWith("/") && !url.startsWith("//");
};

export const validateUrl = (url: string): string => {
	if (isValidUrl(url)) return url;
	if (isInternalUrl(url)) return url;
	return "/";
};

export const validateAndNormalizeUrl = (
	url: string,
): {
	url: string;
	isExternal: boolean;
	isValid: boolean;
} => {
	if (!url) return { url: "/", isExternal: false, isValid: false };

	if (isInternalUrl(url)) {
		return { url, isExternal: false, isValid: true };
	}

	if (isExternalUrl(url)) {
		try {
			const urlObject = new URL(url);
			if (urlObject.protocol !== "https:" && urlObject.protocol !== "http:") {
				return { url: "/", isExternal: false, isValid: false };
			}
			return { url, isExternal: true, isValid: true };
		} catch {
			return { url: "/", isExternal: false, isValid: false };
		}
	}

	return { url: "/", isExternal: false, isValid: false };
};

export const getDomainFromUrl = (url: string): string => {
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
};
