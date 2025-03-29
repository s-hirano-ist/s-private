export const isValidUrl = (url: string) => {
	try {
		const urlObject = new URL(url);
		return urlObject.protocol === "http:" || urlObject.protocol === "https:";
	} catch {
		return false;
	}
};

export const validateUrl = (url: string): string => {
	if (isValidUrl(url)) return url;
	return "/";
	// 下記のような対策でもOK
	// if (/^https?:\/\//.exec(url)) return url;
	// return "/"
};
